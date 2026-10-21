import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";

// No API or database is contacted. These tests exercise rendered forms, dialogs, and their real handlers.
const browser = new Window({ url: "http://localhost:5173", settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true, handleDisabledFileLoadingAsSuccess: true } });
for (const name of ["window", "document", "navigator", "Element", "HTMLElement", "HTMLDialogElement", "Event", "MouseEvent", "FormData", "MutationObserver"]) {
  Object.defineProperty(globalThis, name, { configurable: true, value: name === "window" ? browser : browser[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.matchMedia = browser.matchMedia.bind(browser);
const React = await import("react");
const { act, createElement: h } = React;
const { createRoot } = await import("react-dom/client");
const { default: toast, Toaster } = await import("react-hot-toast");
const { MemoryRouter, Routes, Route, useNavigate } = await import("react-router-dom");
const { createServer } = await import("vite");
const { default: react } = await import("@vitejs/plugin-react");

let vite, root, container, ConfirmationProvider, useConfirmation, AuthContext, AuthProvider, api;
let AuthPage, AdminLoginPage, ResetPasswordPage, AdminUsersPage, AdminCafesPage, AdminSuggestionsPage, UserSettingsPage, SecuritySettings, AdminSettingsPage;
let HomePage, UserLayout, ExplorePage, AdminLayout, AuthLayout, PolicyPage;
let EmailSettings, ChangeEmailPage;
let PopularCafeCarousel;
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
  ({ default: ResetPasswordPage } = await load("pages/auth/ResetPasswordPage.jsx"));
  ({ default: AdminUsersPage } = await load("pages/admin/AdminUsersPage.jsx"));
  ({ default: AdminCafesPage } = await load("pages/admin/AdminCafesPage.jsx"));
  ({ default: AdminSuggestionsPage } = await load("pages/admin/AdminSuggestionsPage.jsx"));
  ({ default: UserSettingsPage } = await load("pages/user/UserSettingsPage.jsx"));
  ({ default: SecuritySettings } = await load("components/user/SecuritySettings.jsx"));
  ({ default: AdminSettingsPage } = await load("pages/admin/AdminSettingsPage.jsx"));
  ({ default: HomePage } = await load("pages/user/HomePage.jsx"));
  ({ default: UserLayout } = await load("components/layout/UserLayout.jsx"));
  ({ default: AdminLayout } = await load("components/layout/AdminLayout.jsx"));
  ({ default: AuthLayout } = await load("components/layout/AuthLayout.jsx"));
  ({ default: PolicyPage } = await load("pages/legal/PolicyPage.jsx"));
  ({ default: ExplorePage } = await load("pages/user/ExplorePage.jsx"));
  ({ default: EmailSettings } = await load("components/user/EmailSettings.jsx"));
  ({ default: ChangeEmailPage } = await load("pages/auth/ChangeEmailPage.jsx"));
  ({ default: PopularCafeCarousel } = await load("components/cafe/PopularCafeCarousel.jsx"));
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
  await fill(container.querySelector('[name="confirmPassword"]'), "test-password-123");
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
  await fill(container.querySelector('[name="password"]'), "test-password-123");
  await click(button("Create Account"));
  assert.equal(document.activeElement, container.querySelector('[name="confirmPassword"]'));
  assert.equal(signups.length, 0);
  assert.equal([...container.querySelectorAll('[role="status"]')].filter((element) => element.textContent === reminder).length, 1);
  await fill(container.querySelector('[name="name"]'), "   ");
  await fill(container.querySelector('[name="confirmPassword"]'), "test-password-123");
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
  await fill(container.querySelector('[name="confirmPassword"]'), "test-password-123");
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
    assert.equal(container.querySelector('[name="confirmPassword"]'), null);
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
  await fill(container.querySelector('[name="confirmPassword"]'), "1234567");
  await click(button("Create Account"));
  assert.match(container.textContent, /Password must be at least 8 characters/);
  assert.equal(document.activeElement, container.querySelector('[name="password"]'));
  await click(button("Create Account"));
  assert.equal(signups.length, 0);
  assert.equal([...container.querySelectorAll('[role="status"]')].filter((element) => element.textContent === "Password must be at least 8 characters.").length, 1);
  await fill(container.querySelector('[name="password"]'), "12345678");
  await fill(container.querySelector('[name="confirmPassword"]'), "12345678");
  await click(container.querySelector('[name="acceptedPolicies"]'));
  await click(button("Accept", dialog()));
  await click(button("Create Account"));
  assert.equal(signups.length, 1);
  assert.equal(signups[0].password, "12345678");
});

test("signup blocks mismatched passwords and submits only the matching password", async () => {
  const signups = [];
  function Signup() { return h(React.Fragment, null, h(AuthPage), h(Toaster)); }
  await mount(Signup, { path: "/signup", auth: { signup: async (fields) => { signups.push(fields); return person; } } });
  await fill(container.querySelector('[name="name"]'), "Test Person");
  await fill(container.querySelector('[name="email"]'), "new@example.com");
  await fill(container.querySelector('[name="password"]'), "test-password-123");
  await fill(container.querySelector('[name="confirmPassword"]'), "test-password-124");
  await click(container.querySelector('[name="acceptedPolicies"]'));
  await click(button("Accept", dialog()));
  await click(button("Create Account"));
  assert.equal(signups.length, 0);
  assert.match(container.textContent, /Passwords don't match/);
  assert.equal(document.activeElement, container.querySelector('[name="confirmPassword"]'));
  await click(button("Create Account"));
  assert.equal([...container.querySelectorAll('[role="status"]')].filter((element) => element.textContent === "Passwords don't match.").length, 1);
  await fill(container.querySelector('[name="confirmPassword"]'), "test-password-123 ");
  await click(button("Create Account"));
  assert.equal(signups.length, 0, "Password matching must not trim significant characters");
  await fill(container.querySelector('[name="confirmPassword"]'), "test-password-123");
  await click(button("Create Account"));
  assert.deepEqual(signups, [{ name: "Test Person", email: "new@example.com", password: "test-password-123", acceptedPolicies: true }]);
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

for (const hasPassword of [true, false]) {
  test(`${hasPassword ? "password update" : "first password"} reminders block invalid submissions and return focus to the field`, async () => {
    await mount(SecuritySettings, { auth: { user: { ...person, hasPassword }, updateUser: () => {} } });
    const saveLabel = hasPassword ? "Update Password" : "Set Password";
    const required = hasPassword ? ["current", "next", "confirm"] : ["next", "confirm"];
    for (const name of required) {
      const field = container.querySelector(`[name="${name}"]`);
      await click(button(saveLabel));
      assert.match(dialog().textContent, /fill out all password fields/);
      assert.equal(document.activeElement, button("Got it", dialog()));
      assert.equal(mutations().length, 0);
      await click(button("Got it", dialog()));
      assert.equal(dialog(), null);
      assert.equal(document.activeElement, field);
      await fill(field, name === "current" ? "old-test-password" : "new-test-password");
    }

    const next = container.querySelector('[name="next"]');
    const confirmation = container.querySelector('[name="confirm"]');
    await fill(next, "short");
    await fill(confirmation, "short");
    await click(button(saveLabel));
    assert.match(dialog().textContent, /at least 8 characters/);
    await act(async () => dialog().dispatchEvent(new browser.Event("cancel", { cancelable: true })));
    assert.equal(dialog(), null);
    assert.equal(document.activeElement, next);
    assert.equal(next.value, "short");

    await fill(next, "new-test-password");
    await fill(confirmation, "different-test-password");
    await click(button(saveLabel));
    assert.match(dialog().textContent, /passwords don't match/);
    await click(dialog().querySelector('[aria-label="Close"]'));
    assert.equal(document.activeElement, confirmation);
    assert.equal(confirmation.value, "different-test-password");
    assert.equal(mutations().length, 0);

    await fill(confirmation, "new-test-password");
    await click(button(saveLabel));
    assert.match(dialog().textContent, hasPassword ? /Change your password\?/ : /Set an account password\?/);
    assert.equal(mutations().length, 0);
    await click(button("Cancel", dialog()));
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

test("user email update validates fields, waits for confirmation, and preserves the current email", async () => {
  const patches = [];
  function Settings() {
    const [user, setUser] = React.useState(person);
    return h(AuthContext, { value: { user, updateUser: (patch) => { patches.push(patch); setUser((previous) => ({ ...previous, ...patch })); } } }, h(EmailSettings));
  }
  respond = () => ({ user: { ...person, pendingEmail: "new@example.com" } });
  await mount(Settings);
  await click(button("Update Email"));
  assert.match(dialog().textContent, /Enter your new email address/);
  assert.equal(mutations().length, 0);
  await click(button("Got it", dialog()));
  assert.equal(document.activeElement, container.querySelector('[name="email"]'));
  await fill(container.querySelector('[name="email"]'), "bad-email");
  await fill(container.querySelector('[name="emailCurrentPassword"]'), "test-password");
  await click(button("Update Email"));
  assert.match(dialog().textContent, /Enter a valid email address/);
  await click(button("Got it", dialog()));
  assert.equal(mutations().length, 0);
  await fill(container.querySelector('[name="email"]'), "TEST@example.com");
  await click(button("Update Email"));
  assert.match(dialog().textContent, /different from your current one/);
  await click(button("Got it", dialog()));
  await fill(container.querySelector('[name="email"]'), "NEW@example.com");
  await fill(container.querySelector('[name="emailCurrentPassword"]'), "");
  await click(button("Update Email"));
  assert.match(dialog().textContent, /Enter your current password/);
  await click(button("Got it", dialog()));
  assert.equal(document.activeElement, container.querySelector('[name="emailCurrentPassword"]'));
  assert.equal(container.querySelector('[name="email"]').value, "NEW@example.com");
  assert.equal(mutations().length, 0);
  await fill(container.querySelector('[name="emailCurrentPassword"]'), "test-password");
  await click(button("Update Email"));
  assert.match(dialog().textContent, /new@example.com/);
  assert.equal(mutations().length, 0);
  await click(button("Cancel", dialog()));
  assert.equal(container.querySelector('[name="email"]').value, "NEW@example.com");
  await click(button("Update Email"));
  await submit();
  assert.deepEqual(mutations(), [{ method: "patch", url: "/users/me/email", data: { email: "new@example.com", currentPassword: "test-password" } }]);
  assert.deepEqual(patches, [{ pendingEmail: "new@example.com" }]);
  assert.match(container.textContent, /Current email: test@example.com/);
  assert.match(container.textContent, /Waiting for confirmation from new@example.com/);
  assert.equal(container.querySelector('[name="emailCurrentPassword"]').value, "");
  await click(button("Cancel Email Change"));
  await click(button("Cancel Email Change", dialog()));
  assert.equal(mutations()[1].method, "delete");
  assert.doesNotMatch(container.textContent, /Waiting for confirmation/);
});

test("email-update failures stay in the dialog and Google-only accounts are guided to set a password", async () => {
  respond = () => { throw Object.assign(new Error("In use"), { response: { status: 409, data: { message: "That email address is already in use." } } }); };
  await mount(EmailSettings, { auth: { updateUser: () => {} } });
  await fill(container.querySelector('[name="email"]'), "taken@example.com");
  await fill(container.querySelector('[name="emailCurrentPassword"]'), "test-password");
  await click(button("Update Email"));
  await submit();
  assert.match(dialog().querySelector('[role="alert"]').textContent, /already in use/);
  await click(button("Cancel", dialog()));
  await act(async () => root.unmount());
  container.remove();
  root = null;
  await mount(SecuritySettings, { auth: { user: { ...person, hasPassword: false }, updateUser: () => {} } });
  assert.match(container.querySelector('[aria-label="Update email"]').textContent, /Set an account password below/);
  assert.equal(container.querySelector('[name="email"]'), null);
  assert.ok(button("Set Password"));
});

test("email confirmation requires an explicit click, clears the session on success, and handles bad links", async () => {
  const updates = [];
  respond = () => ({ message: "Email updated. Sign in with your new email address." });
  await mount(ChangeEmailPage, { path: "/change-email#token=test-only-email-token", auth: { setUser: (user) => updates.push(user) } });
  assert.equal(mutations().length, 0);
  await click(button("Confirm Email"));
  assert.deepEqual(mutations(), [{ method: "post", url: "/auth/confirm-email-change", data: { token: "test-only-email-token" } }]);
  assert.deepEqual(updates, [null]);
  assert.match(container.textContent, /Email updated/);
  assert.equal(container.querySelector('a[href="/login"]').textContent, "Log In");
});

test("expired email-change links display the error without clearing a working session", async () => {
  const updates = [];
  respond = () => { throw Object.assign(new Error("Expired"), { response: { status: 400, data: { message: "This email change link is invalid or has expired." } } }); };
  await mount(ChangeEmailPage, { path: "/change-email#token=expired-test-token", auth: { setUser: (user) => updates.push(user) } });
  await click(button("Confirm Email"));
  assert.match(container.querySelector('[role="alert"]').textContent, /invalid or has expired/);
  assert.deepEqual(updates, []);
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

test("admin credentials show the user-login error and authenticate only through Admin Access", async () => {
  const { useAuth } = await vite.ssrLoadModule("/src/hooks/useAuth.js");
  function SessionRole() {
    const { user } = useAuth();
    return h("output", { id: "session-role" }, user?.role ?? "signed-out");
  }
  function Screens() {
    return h(React.Fragment, null, h(SessionRole), h(Routes, null,
      h(Route, { path: "/login", element: h(AuthPage) }),
      h(Route, { path: "/admin/login", element: h(AdminLoginPage) }),
      h(Route, { path: "/admin", element: h("p", null, "Admin dashboard") }),
    ), h(Toaster));
  }
  respond = (config) => {
    if (config.url === "/auth/me") return { user: null };
    if (config.url === "/auth/login") {
      throw Object.assign(new Error("Admin Access required"), { response: { status: 403, data: { message: "Please use Admin Access to sign in." } } });
    }
    assert.equal(config.url, "/admin/login");
    return { user: { ...person, role: "admin" } };
  };
  await mount(Screens, { path: "/login", actualAuth: true });
  await fill(container.querySelector('[name="email"]'), "admin@example.com");
  await fill(container.querySelector('[name="password"]'), "test-admin-password");
  await click(button("Log In", container.querySelector("form")));
  assert.match(container.textContent, /Please use Admin Access to sign in/);
  assert.equal(container.querySelector("#session-role").textContent, "signed-out");
  assert.deepEqual(mutations().map((request) => request.url), ["/auth/login"]);
  await act(async () => navigate("/admin/login"));
  await fill(container.querySelector('[name="email"]'), "admin@example.com");
  await fill(container.querySelector('[name="password"]'), "test-admin-password");
  await click(button("Access Dashboard"));
  assert.equal(container.querySelector("#session-role").textContent, "admin");
  assert.match(container.textContent, /Admin dashboard/);
  assert.deepEqual(mutations().map((request) => request.url), ["/auth/login", "/admin/login"]);
});

for (const admin of [true, false]) {
  test(`${admin ? "admin" : "user"} password recovery follows the correct login flow`, async () => {
    const updates = [];
    function Screens() {
      return h(React.Fragment, null, h(Routes, null,
        h(Route, { path: "/reset-password", element: h(ResetPasswordPage) }),
        h(Route, { path: "/admin/login", element: h("p", null, "Admin Access login") }),
        h(Route, { path: "/", element: h("p", null, "User home") }),
      ), h(Toaster));
    }
    respond = () => admin
      ? { adminLoginRequired: true, message: "Password updated. Sign in through Admin Access." }
      : { user: person };
    await mount(Screens, { path: "/reset-password#token=test-only-reset", auth: { setUser: (user) => updates.push(user) } });
    await fill(container.querySelector('[name="password"]'), "new-test-password");
    await click(button("Save Password"));
    assert.deepEqual(mutations(), [{ method: "post", url: "/auth/reset-password", data: { token: "test-only-reset", password: "new-test-password" } }]);
    assert.deepEqual(updates, admin ? [null] : [person]);
    assert.match(container.textContent, admin ? /Admin Access login/ : /User home/);
  });
}

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

function HomeScreens() {
  return h(Routes, null, h(Route, { element: h(UserLayout) },
    h(Route, { path: "/", element: h(HomePage) }),
    h(Route, { path: "/explore", element: h(ExplorePage) }),
    h(Route, { path: "/cafes/:id", element: h("p", { id: "cafe-detail" }, "Café details") }),
  ));
}

const searchPanel = () => container.querySelector('[role="dialog"][aria-label="Search cafés"]');
const settleSearch = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 300)); });

const popularCafes = [
  { ...cafe, name: "First Café", description: "A cozy place for coffee.", rating: 4.5 },
  { ...cafe, id: "cafe-2", name: "Second Café", photo: "/uploads/cafes/second.jpg" },
  { ...cafe, id: "cafe-3", name: "Third Café" },
];
const carousel = () => container.querySelector('[aria-roledescription="carousel"]');
const slideName = () => carousel().querySelector("h3").textContent;
const carouselControl = (label) => carousel().querySelector(`button[aria-label="${label}"]`);
function CarouselFixture() { return h(PopularCafeCarousel, { cafes: popularCafes, onSeeAll: () => {} }); }

test("Popular Cafés uses pagination, bookmarks, and café links without arrow or playback buttons", async () => {
  const favoriteUpdates = [];
  respond = (config) => config.method === "post"
    ? { favorites: ["cafe-2"] }
    : { cafes: config.url.includes("sort=popular") ? popularCafes : [cafe] };
  await mount(HomeScreens, { auth: { updateUser: (patch) => favoriteUpdates.push(patch) } });
  assert.equal(container.querySelectorAll('[aria-roledescription="carousel"]').length, 1);
  assert.deepEqual([...container.querySelector("main").querySelectorAll("h2")].map((element) => element.textContent), ["Popular Cafés", "Featured Cafés", "Top Rated", "Recently Added"]);
  assert.equal(slideName(), "First Café");
  for (const label of ["Next café", "Previous café", "Pause slideshow", "Play slideshow"]) {
    assert.equal(carouselControl(label), null);
  }
  const section = carousel().closest("section");
  await click(section.querySelector('[aria-label="Show Third Café (3 of 3)"]'));
  assert.equal(slideName(), "Third Café");
  await click(section.querySelector('[aria-label="Show Second Café (2 of 3)"]'));
  assert.equal(slideName(), "Second Café");
  assert.equal(section.querySelector('[aria-current="true"]').getAttribute("aria-label"), "Show Second Café (2 of 3)");
  await click(carouselControl("Save to favorites"));
  assert.deepEqual(mutations(), [{ method: "post", url: "/cafes/cafe-2/favorite", data: undefined }]);
  assert.ok(favoriteUpdates.some((patch) => patch.favorites.includes("cafe-2")));
  assert.equal(slideName(), "Second Café");
  await click(button("See all", section));
  assert.ok(searchPanel());
  await click(searchPanel().querySelector('[aria-label="Close search"]'));
  await click(carousel().querySelector('a[href="/cafes/cafe-2"]'));
  assert.ok(container.querySelector("#cafe-detail"));
});

test("carousel supports keyboard and horizontal swipes, and recovers from a failed photo", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  await mount(CarouselFixture);
  await act(async () => {
    carousel().focus();
    carousel().dispatchEvent(new browser.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  });
  assert.equal(slideName(), "Second Café");
  const photo = carousel().querySelector("img");
  assert.ok(photo);
  await act(async () => photo.dispatchEvent(new browser.Event("error")));
  assert.equal(carousel().querySelector("img"), null);
  assert.equal(slideName(), "Second Café");
  const swipe = async (x, y) => act(async () => {
    for (const [type, touches] of [["touchstart", [{ clientX: 200, clientY: 100 }]], ["touchend", [{ clientX: x, clientY: y }]]]) {
      const event = new browser.Event(type, { bubbles: true });
      Object.defineProperty(event, type === "touchstart" ? "touches" : "changedTouches", { value: touches });
      carousel().dispatchEvent(event);
    }
  });
  await swipe(190, 250);
  assert.equal(slideName(), "Second Café");
  await swipe(80, 105);
  assert.equal(slideName(), "Third Café");
  await act(async () => context.mock.timers.tick(6000));
  assert.equal(slideName(), "First Café");
});

test("manual slide selection restarts six-second rotation even while hovered or focused", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  await mount(CarouselFixture);
  await act(async () => context.mock.timers.tick(6000));
  assert.equal(slideName(), "Second Café");
  await act(async () => carousel().querySelector("a").focus());
  await act(async () => context.mock.timers.tick(12000));
  assert.equal(slideName(), "Second Café");
  const section = carousel().closest("section");
  const thirdDot = section.querySelector('[aria-label="Show Third Café (3 of 3)"]');
  await act(async () => {
    section.dispatchEvent(new browser.MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body }));
    thirdDot.focus();
  });
  await click(thirdDot);
  await act(async () => context.mock.timers.tick(5999));
  assert.equal(slideName(), "Third Café");
  await act(async () => context.mock.timers.tick(1));
  assert.equal(slideName(), "First Café");
  await act(async () => context.mock.timers.tick(4000));
  await click(section.querySelector('[aria-label="Show First Café (1 of 3)"]'));
  await act(async () => context.mock.timers.tick(5999));
  assert.equal(slideName(), "First Café");
  await act(async () => context.mock.timers.tick(1));
  assert.equal(slideName(), "Second Café");
  await act(async () => context.mock.timers.tick(6000));
  assert.equal(slideName(), "Third Café");
});

test("reduced motion disables automatic rotation, and a single café needs no slide controls", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const original = browser.matchMedia;
  browser.matchMedia = (query) => query === "(prefers-reduced-motion: reduce)"
    ? { matches: true, addEventListener() {}, removeEventListener() {} }
    : original.call(browser, query);
  try {
    await mount(CarouselFixture);
    assert.equal(carouselControl("Pause slideshow"), null);
    await act(async () => context.mock.timers.tick(30000));
    assert.equal(slideName(), "First Café");
    await click(carousel().closest("section").querySelector('[aria-label="Show Second Café (2 of 3)"]'));
    assert.equal(slideName(), "Second Café");
    await act(async () => context.mock.timers.tick(12000));
    assert.equal(slideName(), "Second Café");
  } finally { browser.matchMedia = original; }
  await act(async () => root.unmount());
  root = null;
  container.remove();
  await mount(() => h(PopularCafeCarousel, { cafes: [cafe], onSeeAll: () => {} }));
  assert.equal(carouselControl("Next café"), null);
  assert.equal(carouselControl("Previous café"), null);
  assert.equal(carouselControl("Pause slideshow"), null);
  assert.ok(carousel().querySelector(`a[href="/cafes/${cafe.id}"]`));
});

test("home search opens live results and searches trimmed, encoded text without submitting", async () => {
  const query = "Café & Tea";
  const searchPath = `/cafes?q=${encodeURIComponent(query)}&limit=20`;
  respond = (config) => ({ cafes: [{ ...cafe, name: config.url === searchPath ? query : cafe.name }] });
  await mount(HomeScreens);
  await click(container.querySelector('button[aria-label="Search cafés"]'));
  const panel = searchPanel();
  assert.ok(panel);
  assert.equal(panel.open, true);
  assert.equal(document.activeElement, panel.querySelector("input"));
  await fill(panel.querySelector("input"), `  ${query}  `);
  await settleSearch();
  assert.equal(requests.filter((request) => request.url === searchPath).length, 1);
  const match = panel.querySelector(`a[href="/cafes/${cafe.id}"]`);
  assert.match(match.textContent, /Café & Tea/);
  await click(match);
  assert.ok(container.querySelector("#cafe-detail"));
  assert.equal(searchPanel(), null);
});

test("home search shows no matches, refines results, and can be cancelled with Escape", async () => {
  respond = (config) => ({ cafes: config.url === "/cafes?q=missing&limit=20" ? [] : [cafe] });
  await mount(HomeScreens);
  await click(container.querySelector('button[aria-label="Search cafés"]'));
  const panel = searchPanel();
  await fill(panel.querySelector("input"), "missing");
  await settleSearch();
  assert.match(panel.textContent, /No cafés match “missing”/);
  await fill(panel.querySelector("input"), "Test");
  await settleSearch();
  assert.ok(requests.some((request) => request.url === "/cafes?q=Test&limit=20"));
  assert.ok(panel.querySelector(`a[href="/cafes/${cafe.id}"]`));
  await act(async () => panel.dispatchEvent(new browser.Event("cancel", { cancelable: true })));
  assert.equal(searchPanel(), null);
});

test("See all opens blank search and Explore opens the map page", async () => {
  respond = () => ({ cafes: [cafe] });
  await mount(HomeScreens);
  await click(container.querySelector('button[aria-label="Search cafés"]'));
  assert.equal(searchPanel().querySelector("input").value, "");
  assert.ok(requests.some((request) => request.url === "/cafes?q=&limit=20"));
  await fill(searchPanel().querySelector("input"), "Test");
  await click(searchPanel().querySelector('[aria-label="Close search"]'));
  await click(button("See all"));
  assert.equal(searchPanel().querySelector("input").value, "");
  await click(searchPanel().querySelector('[aria-label="Close search"]'));
  await click(container.querySelector('a[href="/explore"]'));
  assert.match(container.querySelector("h1").textContent, /Explore cafés/);
  assert.equal(searchPanel(), null);
  assert.ok(container.querySelector('[aria-label="Café locations map"]'));
});

test("map pins group shared locations, select café details, and retain unlocated cafés in the list", async () => {
  const located = { ...cafe, address: "Test address", location: { lat: 14.75, lng: 121.02 } };
  const neighbor = { ...located, id: "cafe-2", name: "Neighbor Café" };
  respond = () => ({ cafes: [located, neighbor, { ...cafe, id: "cafe-3", name: "Unlocated Café" }] });
  await mount(HomeScreens, { path: "/explore" });
  const pins = container.querySelectorAll(".brewed-map-pin");
  assert.equal(pins.length, 1);
  assert.equal(pins[0].textContent, "2");
  assert.match(container.textContent, /Location not yet pinned/);
  await click(pins[0]);
  const choices = container.querySelector(".cafe-map-choices");
  assert.ok(choices);
  await click(button("Neighbor Café", choices));
  const details = container.querySelector('[aria-live="polite"]');
  assert.match(details.textContent, /Neighbor Café/);
  assert.equal(details.querySelector("a").getAttribute("href"), "/cafes/cafe-2");
  const popupLink = choices.querySelector('a[href="/cafes/cafe-2"]');
  assert.ok(popupLink);
  await click(button("Show all pins"));
  await click(popupLink);
  assert.ok(container.querySelector("#cafe-detail"));
});

test("search can open filtered map results; map filtering handles empty results and API retry", async () => {
  let failed = false;
  respond = (config) => {
    if (failed) throw Object.assign(new Error("Offline"), { response: { status: 503, data: { message: "Cafés unavailable" } } });
    return { cafes: config.url.includes("q=missing") ? [] : [cafe] };
  };
  await mount(HomeScreens);
  await click(container.querySelector('button[aria-label="Search cafés"]'));
  await fill(searchPanel().querySelector("input"), "Test");
  await settleSearch();
  await click(button("Explore on the map", searchPanel()));
  assert.equal(searchPanel(), null);
  assert.equal(container.querySelector('[aria-label="Filter cafés on map"]').value, "Test");
  assert.ok(requests.some((request) => request.url === "/cafes?q=Test&limit=100"));
  await fill(container.querySelector('[aria-label="Filter cafés on map"]'), "missing");
  await settleSearch();
  assert.match(container.textContent, /No cafés match “missing”/);
  assert.equal(container.querySelectorAll(".brewed-map-pin").length, 0);
  failed = true;
  await fill(container.querySelector('[aria-label="Filter cafés on map"]'), "Test");
  await settleSearch();
  assert.match(container.textContent, /Cafés unavailable/);
  failed = false;
  await click(button("Try again"));
  assert.ok(container.querySelector('[aria-label="Café locations map"]'));
  assert.match(container.textContent, /Test Café/);
});

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


test("user footer keeps copyright and policy links without the mail button", async () => {
  respond = () => ({ cafes: [cafe] });
  await mount(HomeScreens);
  const footer = container.querySelector("footer");
  assert.ok(footer);
  assert.match(footer.textContent, /© 2026 Webiverse Labs\. All rights reserved\./);
  assert.ok(footer.querySelector('a[href="/privacy"]'));
  assert.ok(footer.querySelector('a[href="/terms"]'));
  assert.equal(footer.querySelector("button"), null);
  assert.equal(footer.querySelector("svg"), null);
});

test("admin pages and Admin Access have no footer while user auth and policy pages keep it", async () => {
  function Screens() {
    return h(Routes, null,
      h(Route, { path: "/admin", element: h(AdminLayout) },
        h(Route, { index: true, element: h("p", null, "Admin dashboard") }),
        h(Route, { path: "settings", element: h("p", null, "Admin settings") }),
      ),
      h(Route, { element: h(AuthLayout) },
        h(Route, { path: "/admin/login", element: h(AdminLoginPage) }),
        h(Route, { path: "/login", element: h(AuthPage) }),
        h(Route, { path: "/signup", element: h(AuthPage) }),
      ),
      h(Route, { path: "/privacy", element: h(PolicyPage, { type: "privacy" }) }),
      h(Route, { path: "/terms", element: h(PolicyPage, { type: "terms" }) }),
    );
  }
  await mount(Screens, { path: "/admin" });
  assert.match(container.querySelector("main").textContent, /Admin dashboard/);
  assert.equal(container.querySelector("footer"), null);
  await click(container.querySelector('nav[aria-label="Admin"] a[href="/admin/settings"]'));
  assert.match(container.querySelector("main").textContent, /Admin settings/);
  assert.equal(container.querySelector("footer"), null);
  await act(async () => navigate("/admin/login"));
  assert.match(container.textContent, /Admin Access/);
  assert.equal(container.querySelector("footer"), null);
  for (const path of ["/login", "/signup", "/privacy", "/terms"]) {
    await act(async () => navigate(path));
    const footer = container.querySelector("footer");
    assert.ok(footer);
    assert.equal(footer.querySelector("button"), null);
    assert.equal(footer.querySelector("svg"), null);
    if (path === "/privacy" || path === "/terms") {
      assert.ok(container.querySelector('main a[href="mailto:webiverselabs@gmail.com"]'));
    }
  }
});
