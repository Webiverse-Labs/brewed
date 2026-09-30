// Keyboard support for a role="tablist" of buttons (ARIA tabs pattern, manual activation):
// Left/Right move focus between tabs and wrap around, Home/End jump to the ends,
// and Enter/Space activate the focused tab because each tab is a <button>.
// Pair it with a roving tabIndex (0 on the active tab, -1 on the rest) so Tab enters and leaves the list once.
export function moveTabFocus(e) {
  const tabs = [...e.currentTarget.querySelectorAll('[role="tab"]')];
  const current = tabs.indexOf(document.activeElement);
  if (current === -1) return;
  const target = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[e.key];
  if (target === undefined) return;
  e.preventDefault();
  tabs[(target + tabs.length) % tabs.length].focus();
}
