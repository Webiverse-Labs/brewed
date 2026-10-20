# Confirmation dialogs

Brewed asks for confirmation before these actions:

- Accepting the terms and privacy policy during sign-up. Cancel leaves the agreement checkbox unchecked and preserves the form. A first-time Google account coming through Log In also has to check the agreement and confirm account creation.
- Suspending or reinstating a user, from either the admin table or user details. The dialog identifies the target by name and username.
- Enabling or disabling a café.
- Approving and publishing, or rejecting, a café suggestion.
- Setting or changing a password in account settings.
- Changing an administrator's sign-in email.
- Logging out, from every user and admin entry point.
- Permanently deleting an account. The user must type `DELETE` before the destructive button is enabled.

Dialogs focus Cancel when opened. Cancel, Escape, the close button, and the backdrop dismiss the dialog before an action starts. During a request all actions and dismissal are disabled, and repeated submits cannot create duplicate requests. A failed request stays open with an announced error and permits retry or cancellation. Navigating away cancels a dialog that has not been confirmed.

`ConfirmationProvider` lives above authentication in `RootLayout`. Call `useConfirmation()` to get the `confirm` function, then call `confirm({ title, description, confirmLabel, onConfirm })` with an `onConfirm` callback that performs the action. The callback must throw on failure so the dialog can display the error and allow retry or cancellation. The promise returned by `confirm` resolves to `true` after successful completion, or `false` on cancellation, navigation before confirmation, or when another confirmation is already pending. Do not put the API request after the confirmation promise: the dialog needs to await it to show progress and errors.

Run `npm test --prefix frontend` for the DOM interaction checks. They render the actual components with Happy DOM and intercept Axios requests; they do not connect to MongoDB or change real accounts. Run `npm run lint` and `npm run build` for the normal frontend checks.

Before release, also check the dialogs in a desktop browser and on a phone: tab focus stays in the topmost dialog, focus returns to the trigger after cancellation, an open user-details or suggestion dialog remains underneath its confirmation, and the dialog buttons fit narrow screens. DOM tests do not verify native browser focus trapping, the top layer, or visual layout.
