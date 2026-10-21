# Confirmation dialogs

Brewed asks for confirmation before these actions:

- Accepting the terms and privacy policy during sign-up. Cancel leaves the agreement checkbox unchecked and preserves the form. A first-time Google account coming through Log In also has to check the agreement and confirm account creation.
- Suspending or reinstating a user, from either the admin table or user details. The dialog identifies the target by name and username.
- Enabling or disabling a café.
- Approving and publishing, or rejecting, a café suggestion.
- Setting or changing a password in account settings.
- Changing an administrator's sign-in email.
- Requesting or cancelling a user email change in Settings → Security. The new inbox must confirm its emailed link before the address changes; confirmation signs out existing sessions.
- Logging out, from every user and admin entry point.
- Permanently deleting an account. The user must type `DELETE` before the destructive button is enabled.

Dialogs focus Cancel when opened. Cancel, Escape, the close button, and the backdrop dismiss the dialog before an action starts. During a request all actions and dismissal are disabled, and repeated submits cannot create duplicate requests. A failed request stays open with an announced error and permits retry or cancellation. Navigating away cancels a dialog that has not been confirmed.

The email and password forms in Security show a validation reminder for missing fields, invalid or unchanged email addresses, passwords shorter than eight characters, and mismatched passwords. These reminders focus Got it; dismissal returns focus to the field that needs attention and preserves the form values. Valid forms proceed to the confirmation dialog before saving.

`ConfirmationProvider` lives above authentication in `RootLayout`. Call `useConfirmation()` with a title, description, button labels, and an `onConfirm` callback that performs the action. The callback must throw on failure so the dialog can display the error. The returned promise resolves to `true` after successful completion, or `false` on cancellation. Do not put the API request after the confirmation promise: the dialog needs to await it to show progress and errors.

Run `npm test --prefix frontend` for the DOM interaction checks. They render the actual components with Happy DOM and intercept Axios requests; they do not connect to MongoDB or change real accounts. Run `npm run lint` and `npm run build` for the normal frontend checks.

Before release, also check the dialogs in a desktop browser and on a phone: tab focus stays in the topmost dialog, focus returns to the trigger after cancellation, an open user-details or suggestion dialog remains underneath its confirmation, and the dialog buttons fit narrow screens. DOM tests do not verify native browser focus trapping, the top layer, or visual layout.
