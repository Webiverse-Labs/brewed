import nodemailer from "nodemailer";

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

//links always point at CLIENT_URL, never at a request header, so a forged Host can't redirect a reset link.
//The token sits in the URL fragment (#token=…), which browsers never send to a server, so it stays out of request logs.
const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

let transport;
function getTransport() {
  //short timeouts: a hung SMTP connection shouldn't eat the whole function time limit
  transport ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });
  return transport;
}

//Sends via the team Gmail account. Without credentials it logs the email instead (local dev, CI: the log is how you
//get the link without a real mailbox, and those tokens only work against a throwaway database). In production it
//throws instead, so a missing GMAIL_* variable is noticed and a live token never reaches a log; every Vercel
//deployment counts as production (api/index.js). Always await it: a Vercel function is
//frozen once the response is sent, so a fire-and-forget send may never leave.
export async function sendEmail({ to, subject, text, html }) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_FROM } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    if (process.env.NODE_ENV === "production") throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not set.");
    console.log(`\n[email not sent: no Gmail credentials]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  await getTransport().sendMail({ from: EMAIL_FROM || GMAIL_USER, to, subject, text, html });
}

//one shared layout so both emails look the same; `button` is the call-to-action link
function template({ name, intro, button, url, outro }) {
  const greeting = `Hi ${name.split(" ")[0]},`;
  return {
    text: `${greeting}\n\n${intro}\n\n${button}: ${url}\n\n${outro}\n\n— Brewed`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#2b1e1a;background:#fbf9f5">
  <p>${escapeHtml(greeting)}</p>
  <p>${escapeHtml(intro)}</p>
  <p><a href="${escapeHtml(url)}" style="display:inline-block;background:#2b1e1a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">${escapeHtml(button)}</a></p>
  <p style="font-size:13px;color:#7a8b7b">Or paste this link into your browser:<br>${escapeHtml(url)}</p>
  <p style="font-size:13px;color:#7a8b7b">${escapeHtml(outro)}</p>
</div>`,
  };
}

export function sendVerificationEmail(user, rawToken) {
  const url = `${clientUrl()}/verify-email#token=${rawToken}`;
  return sendEmail({
    to: user.email,
    subject: "Verify your email for Brewed",
    ...template({
      name: user.name,
      intro: "Welcome to Brewed! Confirm your email to post reviews, suggest cafés and follow people.",
      button: "Verify my email",
      url,
      outro: "This link works for 24 hours. If you didn't create a Brewed account, you can ignore this email.",
    }),
  });
}

export function sendPasswordResetEmail(user, rawToken) {
  const url = `${clientUrl()}/reset-password#token=${rawToken}`;
  return sendEmail({
    to: user.email,
    subject: "Reset your Brewed password",
    ...template({
      name: user.name,
      intro: "We got a request to reset your Brewed password.",
      button: "Choose a new password",
      url,
      outro: "This link works for 1 hour. If you didn't ask for this, you can ignore this email; your password won't change.",
    }),
  });
}
