import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";

// No API or database is contacted. These tests exercise rendered forms, dialogs, and their real handlers.
const browser = new Window({ url: "http://localhost:5173", settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true, handleDisabledFileLoadingAsSuccess: true } });
for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLDialogElement", "Event", "MouseEvent", "FormData", "MutationObserver"]) {
  Object.defineProperty(globalThis, name, { configurable: true, value: name === "window" ? browser : browser[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.matchMedia = browser.matchMedia.bind(browser);
const React = await import("react");
const { act, createElement: h } = React;
const { createRoot } = await import("react-dom/client");
const { default: toast, Toaster } = await import("react-hot-toast");
const { MemoryRouter, useNavigate } = await import("react-router-dom");
const { createServer } = await import("vite");
const { default: react } = await import("@vitejs/plugin-react");

let vite, root, container, ConfirmationProvider, useConfirmation, AuthContext, AuthProvider, api;
let AuthPage, AdminLoginPage, AdminUsersPage, AdminCafesPage, AdminSuggestionsPage, UserSettingsPage, SecuritySettings, AdminSettingsPage;
let ask, navigate;
const requests = [];
const person = { id: "user-1", name: "Test User", username: "testuser", email: "test@example.com", status: "active", hasPassword: true, emailVerified: true, visits: 0, favorites: [], createdAt: "2026-10-20T00:00:00Z" };
const cafe = { id: "cafe-1", name: "Test Café", active: true, area: "Test Area", rating: 0, visits: 0, tags: [], photos: [] };
const suggestion = { id: "suggestion-1", name: "Suggested Café", address: "Test Address", status: "pending", submittedBy: person, createdAt: person.createdAt };
let respond;
const jsonResponse = (config, data) => ({ config, data, status: 200, statusText: "OK", headers: {} });

before(async () => {
  vite = await createServer({
    root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, plugins: [react()],
    define: { "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify("test-only-client") },
    server: { middlewareMode: true, watch: null }, appType: "custom", logLevel: "error",
  });
  const load = (path) => vite.ssrLoadModule(`/src/${path}`);
  ({ default: ConfirmationProvider } = await load("context/ConfirmationProvider.jsx"));
  ({ useConfirmation } = await load("hooks/useConfirmation.js"));
  ({ AuthContext } = await load("context/authContext.js"));
  ({ default: AuthProvider } = await load("context/AuthProvider.jsx"));
  ({ default: api } = await load("lib/api.js"));
  ({ default: AuthPage } = await load("pages/auth/AuthPage.jsx"));
  ({ default: AdminLoginPage } = await load("pages/admin/AdminLoginPage.jsx"));
  ({ default: AdminUsersPage } = await load("pages/admin/AdminUsersPage.jsx"));
  ({ default: AdminCafesPage } = await load("pages/admin/AdminCafesPage.jsx"));
  ({ default: AdminSuggestionsPage } = await load("pages/admin/AdminSuggestionsPage.jsx"));
  ({ default: UserSettingsPage } = await load("pages/user/UserSettingsPage.jsx"));
  ({ default: SecuritySettings } = await load("components/user/SecuritySettings.jsx"));
  ({ default: AdminSettingsPage } = await load("pages/admin/AdminSettingsPage.jsx"));
  api.defaults.adapter = async (config) => {
    requests.push({ method: config.method, url: config.url, data: typeof config.data === "string" ? JSON.parse(config.data) : config.data });
    if (!respond) throw new Error(`Unexpected API request: ${config.method} ${config.url}`);
    return jsonResponse(config, await respond(config));
  };
  installGoogleStub();
});

afterEach(async () => {
  await act(async () => {
    toast.remove();
    root?.unmount();
  });
  root = null;
  container?.remove();
  requests.length = 0;
  respond = undefined;
});
after(async () => { await vite?.close(); await browser.happyDOM.close(); });

function Controls() {
  const confirm = useConfirmation();
  const go = useNavigate();
  React.useEffect(() => {
    ask = confirm;
    navigate = go;
  }, [confirm, go]);
  return null;
}
async function mount(Component = () => null, { path = "/", auth = {}, actualAuth = false } = {}) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const contents = h(React.Fragment, null, h(Controls), h(Component));
  const authenticated = actualAuth ? h(AuthProvider, null, contents) : h(AuthContext, { value: { user: person, ...auth } }, contents);
  await act(async () => root.render(h(MemoryRouter, { initialEntries: [path] }, h(ConfirmationProvider, null, authenticated))));
}
const dialog = () => container.querySelector('[role="alertdialog"]');
function button(text, scope = container) {
  const found = [...scope.querySelectorAll("button")].find((element) => element.textContent.trim() === text);
  assert.ok(found, `Button "${text}" was not found`);
  return found;
}
async function click(element) { await act(async () => element.click()); }
async function fill(input, value) {
  assert.ok(input, "Expected an input");
  await act(async () => {
    Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new browser.Event("input", { bubbles: true }));
  });
}
async function open(options) {
  let result;
  await act(async () => { result = ask({ title: "Confirm action?", description: "Test action", ...options }); });
  return { result };
}
async function submit(scope = dialog()) {
  await act(async () => scope.querySelector("form").dispatchEvent(new browser.Event("submit", { bubbles: true, cancelable: true })));
}
const mutations = () => requests.filter((request) => request.method !== "get");

test("cancel, Escape, close button, and backdrop do not execute the action", async () => {
  await mount();
  let calls = 0;
  for (const close of [
    () => button("Cancel", dialog()).click(),
    () => dialog().dispatchEvent(new browser.Event("cancel", { cancelable: true })),
    () => dialog().querySelector('[aria-label="Close"]').click(),
    () => dialog().querySelector('[aria-label="Close dialog"]').click(),
  ]) {
    const { result } = await open({ onConfirm: () => { calls++; } });
    assert.equal(document.activeElement, button("Cancel", dialog()));
    await act(async () => close());
    assert.equal(await result, false);
    assert.equal(dialog(), null);
  }
  assert.equal(calls, 0);
});

test("pending confirmation blocks repeat submits and dismissal", async () => {
  await mount();
  let finish, calls = 0;
  const wait = new Promise((resolve) => { finish = resolve; });
  const { result } = await open({ onConfirm: async () => { calls++; await wait; } });
  await act(async () => {
    const form = dialog().querySelector("form");
    form.dispatchEvent(new browser.Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new browser.Event("submit", { bubbles: true, cancelable: true }));
  });
  assert.equal(calls, 1);
  assert.equal(dialog().getAttribute("aria-busy"), "true");
  assert.ok([...dialog().querySelectorAll("button")].every((element) => element.disabled));
  const escape = new browser.Event("cancel", { cancelable: true });
  await act(async () => dialog().dispatchEvent(escape));
  assert.equal(escape.defaultPrevented, true);
  assert.ok(dialog());
  await act(async () => finish());
  assert.equal(await result, true);
  assert.equal(dialog(), null);
});

test("failed requests stay open with an accessible error and can be retried", async () => {
  await mount();
  let calls = 0;
  const { result } = await open({ onConfirm: () => {
    if (++calls === 1) throw { response: { data: { message: "Unable to update this account." } } };
  } });
  await submit();
  assert.match(dialog().querySelector('[role="alert"]').textContent, /Unable to update/);
  assert.equal(button("Confirm", dialog()).disabled, false);
  await submit();
  assert.equal(await result, true);
  assert.equal(calls, 2);
});

test("typed deletion and policy checkbox requirements cannot be skipped", async () => {
  await mount();
  let calls = 0;
  const { result } = await open({ verificationText: "DELETE", checkboxLabel: "I understand", onConfirm: () => { calls++; } });
  await submit();
  assert.equal(calls, 0);
  await fill(dialog().querySelector('input:not([type="checkbox"])'), "delete");
  await click(dialog().querySelector('input[type="checkbox"]'));
  await submit();
  assert.equal(calls, 0);
  await fill(dialog().querySelector('input:not([type="checkbox"])'), "DELETE");
  assert.equal(button("Confirm", dialog()).disabled, false);
  await submit();
  assert.equal(await result, true);
  assert.equal(calls, 1);
});

test("a duplicate request cannot replace the target; navigation cancels an unconfirmed action", async () => {
  await mount();
  let calls = 0;
  const { result } = await open({ onConfirm: () => { calls++; } });
  assert.equal(await ask({ title: "Other target", onConfirm: () => { calls++; } }), false);
  assert.match(dialog().textContent, /Confirm action/);
  await act(async () => navigate("/other"));
  assert.equal(await result, false);
  assert.equal(calls, 0);
  assert.equal(dialog(), null);
});

test("signup policy cancellation preserves the form; acceptance checks the box before signup", async () => {
  const signups = [];
  await mount(AuthPage, { path: "/signup", auth: { signup: async (fields) => { signups.push(fields); return person; } } });
  await fill(container.querySelector('[name="name"]'), "Test Person");
  await fill(container.querySelector('[name="email"]'), "new@example.com");
  await fill(container.querySelector('[name="password"]'), "test-password-123");
  const checkbox = container.querySelector('[name="acceptedPolicies"]');
  await click(checkbox);
  assert.match(dialog().textContent, /Accept Brewed's policies/);
  assert.equal(checkbox.checked, false);
  assert.equal(dialog().querySelectorAll('a[target="_blank"]').length, 2);
  await click(button("Cancel", dialog()));
  assert.equal(checkbox.checked, false);
  assert.equal(container.querySelector('[name="email"]').value, "new@example.com");
  assert.equal(signups.length, 0);
  await click(checkbox);
  await click(button("Accept", dialog()));
  assert.equal(checkbox.checked, true);
  await click(button("Create Account"));
  assert.equal(signups.length, 1);
  assert.equal(signups[0].acceptedPolicies, true);
});

test("incomplete signup shows one reminder, focuses the missing field, and never sends a signup", async () => {
  const signups = [];
  function Signup() { return h(React.Fragment, null, h(AuthPage), h(Toaster)); }
  await mount(Signup, { path: "/signup", auth: { signup: async (fields) => { signups.push(fields); return person; } } });
  await click(button("Create Account"));
  const reminder = "Please fill out all fields before signing up.";
  assert.match(container.textContent, /Please fill out all fields before signing up/);
  assert.equal(document.activeElement, container.querySelector('[name="name"]'));
  await fill(container.querySelector('[name="name"]'), "Test Person");
  await click(button("Create Account"));
  assert.equal(document.activeElement, container.querySelector('[name="email"]'));
  await fill(container.querySelector('[name="email"]'), "new@example.com");
  await click(button("Create Account"));
  assert.equal(document.activeElement, container.querySelector('[name="password"]'));
  assert.equal(signups.length, 0);
  assert.equal([...container.querySelectorAll('[role="status"]')].filter((element) => element.textContent === reminder).length, 1);
  await fill(container.querySelector('[name="name"]'), "   ");
  await fill(container.querySelector('[name="password"]'), "test-password-123");
  await click(button("Create Account"));
  assert.equal(document.activeElement, container.querySelector('[name="name"]'));
  assert.equal(signups.length, 0);
});

test("custom signup reminder preserves email, password length, and required agreement checks", async () => {
  const signups = [];
  function Signup() { return h(React.Fragment, null, h(AuthPage), h(Toaster)); }
  await mount(Signup, { path: "/signup", auth: { signup: async (fields) => { signups.push(fields); return person; } } });
  await fill(container.querySelector('[name="name"]'), "Test Person");
  await fill(container.querySelector('[name="email"]'), "not-an-email");
  await fill(container.querySelector('[name="password"]'), "test-password-123");
  await click(container.querySelector('[name="acceptedPolicies"]'));
  await click(button("Accept", dialog()));
  await click(button("Create Account"));
  assert.equal(signups.length, 0);
  await fill(container.querySelector('[name="email"]'), "new@example.com");
  await fill(container.querySelector('[name="password"]'), "short");
  await click(button("Create Account"));
  assert.equal(signups.length, 0);
  await fill(container.querySelector('[name="password"]'), "test-password-123");
  await click(container.querySelector('[name="acceptedPolicies"]'));
  await click(button("Create Account"));
  assert.equal(signups.length, 0);
  assert.match(container.textContent, /Please accept the Terms & Privacy Policy/);
  assert.equal(document.activeElement, container.querySelector('[name="acceptedPolicies"]'));
  await click(button("Create Account"));
  assert.equal([...container.querySelectorAll('[role="status"]')].filter((element) => element.textContent === "Please accept the Terms & Privacy Policy.").length, 1);
  await click(container.querySelector('[name="acceptedPolicies"]'));
  await click(button("Cancel", dialog()));
  assert.equal(container.querySelector('[name="acceptedPolicies"]').checked, false);
  assert.equal(signups.length, 0);
  await click(container.querySelector('[name="acceptedPolicies"]'));
  await click(button("Accept", dialog()));
  await click(button("Create Account"));
  assert.equal(signups.length, 1);
  assert.equal(signups[0].acceptedPolicies, true);
});

for (const admin of [false, true]) {
  test(`${admin ? "admin" : "user"} login reminds about missing fields and preserves email validation`, async () => {
    const logins = [];
    function Login() { return h(React.Fragment, null, h(admin ? AdminLoginPage : AuthPage), h(Toaster)); }
    await mount(Login, {
      path: admin ? "/admin/login" : "/login",
      auth: { login: async (...args) => { logins.push(args); return person; } },
    });
    const submitLabel = admin ? "Access Dashboard" : "Log In";
    const submitButton = button(submitLabel, container.querySelector("form"));
    const reminder = "Please fill out all fields before logging in.";
    await click(submitButton);
    assert.match(container.textContent, /Please fill out all fields before logging in/);
    assert.equal(document.activeElement, container.querySelector('[name="email"]'));
    await fill(container.querySelector('[name="email"]'), "invalid-email");
    await click(submitButton);
    assert.equal(document.activeElement, container.querySelector('[name="password"]'));
    assert.equal([...container.querySelectorAll('[role="status"]')].filter((element) => element.textContent === reminder).length, 1);
    await fill(container.querySelector('[name="password"]'), "short");
    await click(submitButton);
    assert.equal(logins.length, 0);
    await fill(container.querySelector('[name="email"]'), "test@example.com");
    await click(submitButton);
    assert.equal(logins.length, 1);
    assert.deepEqual(logins[0], admin ? ["test@example.com", "short", { admin: true }] : ["test@example.com", "short"]);
  });
}

test("signup shows the password-length popup below eight characters and allows an eight-character password", async () => {
  const signups = [];
  function Signup() { return h(React.Fragment, null, h(AuthPage), h(Toaster)); }
  await mount(Signup, { path: "/signup", auth: { signup: async (fields) => { signups.push(fields); return person; } } });
  await fill(container.querySelector('[name="name"]'), "Test Person");
  await fill(container.querySelector('[name="email"]'), "new@example.com");
  await fill(container.querySelector('[name="password"]'), "1234567");
  await click(button("Create Account"));
  assert.match(container.textContent, /Password must be at least 8 characters/);
  assert.equal(document.activeElement, container.querySelector('[name="password"]'));
  await click(button("Create Account"));
  assert.equal(signups.length, 0);
  assert.equal([...container.querySelectorAll('[role="status"]')].filter((element) => element.textContent === "Password must be at least 8 characters.").length, 1);
  await fill(container.querySelector('[name="password"]'), "12345678");
  await click(container.querySelector('[name="acceptedPolicies"]'));
  await click(button("Accept", dialog()));
  await click(button("Create Account"));
  assert.equal(signups.length, 1);
  assert.equal(signups[0].password, "12345678");
});

for (const status of ["active", "suspended"]) {
  test(`admin ${status === "active" ? "suspension" : "reinstatement"} waits for confirmation from user details`, async () => {
    respond = (config) => config.method === "get" ? { users: [{ ...person, status }] } : {};
    await mount(AdminUsersPage);
    await click(button("View"));
    await click(button(status === "active" ? "Suspend user" : "Reinstate user"));
    assert.equal(mutations().length, 0);
    assert.match(dialog().textContent, /Test User/);
    await click(button("Cancel", dialog()));
    assert.equal(mutations().length, 0);
    await click(button(status === "active" ? "Suspend user" : "Reinstate user"));
    await submit();
    assert.deepEqual(mutations(), [{ method: "patch", url: "/admin/users/user-1", data: { status: status === "active" ? "suspended" : "active" } }]);
    assert.ok(container.querySelector('dialog[role="dialog"][open]'), "User details should remain open");
  });
}

test("permanent account deletion needs DELETE and runs only once after confirmation", async () => {
  const updates = [];
  respond = () => ({});
  await mount(UserSettingsPage, { path: "/settings?tab=security", auth: { setUser: (value) => updates.push(value) } });
  await click(button("Delete"));
  assert.match(dialog().textContent, /cannot be undone/);
  assert.equal(button("Delete My Account", dialog()).disabled, true);
  await submit();
  assert.equal(mutations().length, 0);
  await fill(dialog().querySelector("input"), "DELETE");
  await click(button("Delete My Account", dialog()));
  assert.deepEqual(mutations(), [{ method: "delete", url: "/users/me", data: undefined }]);
  assert.deepEqual(updates, [null]);
});

for (const active of [true, false]) {
  test(`café ${active ? "disable" : "enable"} waits for confirmation`, async () => {
    respond = (config) => config.method === "get" ? { cafes: [{ ...cafe, active }] } : { cafe: { ...cafe, active: !active } };
    await mount(AdminCafesPage);
    await click(button(active ? "Disable" : "Enable"));
    assert.equal(mutations().length, 0);
    await submit();
    assert.deepEqual(mutations()[0], { method: "patch", url: "/admin/cafes/cafe-1", data: { active: !active } });
  });
}

for (const status of ["approved", "rejected"]) {
  test(`suggestion ${status} waits for confirmation`, async () => {
    respond = (config) => config.method === "get" ? { suggestions: [suggestion] } : { suggestion: { ...suggestion, status } };
    await mount(AdminSuggestionsPage);
    await click(button("Review"));
    await click(button(status === "approved" ? "Approve" : "Reject"));
    assert.equal(mutations().length, 0);
    await submit();
    assert.deepEqual(mutations()[0], { method: "patch", url: "/admin/suggestions/suggestion-1", data: { status } });
  });
}

test("password change can be cancelled without losing input or sending a request", async () => {
  respond = () => ({});
  await mount(SecuritySettings, { auth: { updateUser: () => {} } });
  await fill(container.querySelector('[name="current"]'), "old-test-password");
  await fill(container.querySelector('[name="next"]'), "new-test-password");
  await fill(container.querySelector('[name="confirm"]'), "new-test-password");
  await click(button("Update Password"));
  await click(button("Cancel", dialog()));
  assert.equal(mutations().length, 0);
  assert.equal(container.querySelector('[name="next"]').value, "new-test-password");
  await click(button("Update Password"));
  await submit();
  assert.deepEqual(mutations()[0], { method: "patch", url: "/users/me/password", data: { current: "old-test-password", next: "new-test-password" } });
});

test("changing the admin sign-in email requires confirmation", async () => {
  respond = () => ({ user: { ...person, email: "new-admin@example.com" } });
  await mount(AdminSettingsPage, { auth: { setUser: () => {} } });
  await fill(container.querySelector('[name="email"]'), "new-admin@example.com");
  await click(button("Save Changes"));
  assert.equal(mutations().length, 0);
  assert.match(dialog().textContent, /new-admin@example.com/);
  await submit();
  assert.equal(mutations()[0].url, "/admin/me");
  assert.equal(mutations()[0].data.email, "new-admin@example.com");
});

test("all logout callers use the shared auth confirmation", async () => {
  const { useAuth } = await vite.ssrLoadModule("/src/hooks/useAuth.js");
  function Logout() {
    const { user, logout } = useAuth();
    return h("button", { onClick: () => { void logout(); } }, user ? "Log Out" : "Logged Out");
  }
  respond = (config) => config.method === "get" ? { user: person } : {};
  await mount(Logout, { actualAuth: true });
  await click(button("Log Out"));
  await click(button("Cancel", dialog()));
  assert.equal(mutations().length, 0);
  await click(button("Log Out"));
  await submit();
  assert.deepEqual(mutations(), [{ method: "post", url: "/auth/logout", data: undefined }]);
  assert.ok(button("Logged Out"));
});

function installGoogleStub() {
  let receive;
  browser.google = { accounts: { id: {
    initialize: ({ callback }) => { receive = callback; },
    renderButton: (box) => {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.textContent = "Test Google";
      trigger.addEventListener("click", () => receive({ credential: "test-only-credential" }));
      box.append(trigger);
    },
  } } };
}

test("new Google account from login requires a checkbox and confirmation before creating the account", async () => {
  const calls = [];
  await mount(AuthPage, { path: "/login", auth: {
    loginWithGoogle: async (credential, options) => {
      calls.push({ credential, ...options });
      if (!options.acceptedPolicies) throw { response: { data: { code: "POLICY_ACCEPTANCE_REQUIRED" } } };
      return { user: person, isNew: true };
    },
  } });
  await click(button("Test Google"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].acceptedPolicies, false);
  assert.equal(button("Accept and Create Account", dialog()).disabled, true);
  await submit();
  assert.equal(calls.length, 1);
  await click(button("Cancel", dialog()));
  assert.equal(calls.length, 1);
  await click(button("Test Google"));
  await click(dialog().querySelector('input[type="checkbox"]'));
  await click(button("Accept and Create Account", dialog()));
  assert.equal(calls.length, 3);
  assert.equal(calls[2].acceptedPolicies, true);
  assert.equal(dialog(), null);
});
