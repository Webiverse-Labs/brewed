import { Link } from "react-router-dom";
import Logo from "../../components/ui/Logo.jsx";
import { CopyDeveloperEmailButton } from "../../components/layout/Footer.jsx";

const policies = {
  privacy: {
    title: "Privacy Policy",
    introduction: "This policy explains how Brewed uses information when you create an account and keep your café diary.",
    sections: [
      {
        title: "Information we collect",
        content: "We store your name, email address, username, password hash if you set a password, and any profile details or avatar you add. If you use Google sign-in, we receive your Google account identifier, name, and verified email address. We also store the visits, ratings, orders, notes, photos, saved cafés, follows, and café suggestions you submit, along with the date and policy version you accepted when signing up.",
      },
      {
        title: "How we use your information",
        content: "We use this information to manage your account, sign you in, send verification and password-reset emails, display your diary and community activity, calculate café ratings, and review café suggestions. Administrators can manage accounts, café listings, and suggestions to operate the service.",
      },
      {
        title: "What other people can see",
        content: "Your name, username, avatar, bio, saved cafés, and cafés visited through public reviews can appear on your profile. Public reviews are visible to others; an anonymous review hides its author in the interface. Diary entries are excluded from other people's profiles and café reviews. Uploaded image links can be viewed by anyone who has the link. Café suggestions are reviewed by administrators, and approved café details may be published.",
      },
      {
        title: "Cookies and service providers",
        content: "Brewed uses an authentication cookie to keep you signed in. Logging out clears that cookie in your browser. Hosting and database services process stored app data, and the email provider processes account emails. Pages load fonts from Google and, when enabled, Google's sign-in widget. These providers also process requests under their own privacy practices.",
      },
      {
        title: "Your choices and account deletion",
        content: <>
          You can update your profile in <Link to="/settings" className="text-accent underline">Settings</Link> and
          delete your account under Settings → Security. Account deletion removes your account, visit logs, follows,
          related notifications, avatar, and visit photos from the app's active data. Café suggestions and café listings
          created from them may remain. Do not include private personal information in a café suggestion.
        </>,
      },
      {
        title: "Your privacy rights",
        content: <>
          Depending on applicable law, you may have rights to access, correct, object to processing, or request deletion
          of your personal information, and to raise a privacy complaint. Read the Philippine National Privacy
          Commission's{" "}
          <a href="https://privacy.gov.ph/data-subject-rights/" target="_blank" rel="noopener noreferrer" className="text-accent underline">
            guide to data subject rights
          </a>{" "}
          for more information.
        </>,
      },
    ],
  },
  terms: {
    title: "Terms and Conditions",
    introduction: "These terms cover your use of Brewed to discover cafés, share reviews, and record visits.",
    sections: [
      {
        title: "Using Brewed",
        content: "Brewed is a café discovery and diary service. Café listings and community reviews are provided for information. Opening hours, menus, prices, and availability can change; confirm important details directly with the café.",
      },
      {
        title: "Your account",
        content: "Provide accurate account information, use an email address you control, and keep your sign-in details secure. Do not impersonate other people or access accounts without permission. Email verification is required before posting reviews, suggesting cafés, or following other users.",
      },
      {
        title: "Community conduct",
        content: "Keep reviews honest and relevant to your experience. Do not submit spam, fraudulent ratings, harassment, threats, unlawful material, or another person's private information. Only upload content you own or have permission to share.",
      },
      {
        title: "Your content",
        content: "You retain ownership of your content. By submitting it, you allow Brewed to store, process, and display it as needed for the features you use, including showing public reviews and reviewing café suggestions. Choose carefully between a public review and a diary entry, and read the Privacy Policy before uploading personal information or photos.",
      },
      {
        title: "Suggestions and moderation",
        content: "Café suggestions are sent to administrators for review. Submission does not guarantee publication. Administrators may approve or reject suggestions and suspend accounts that misuse the service.",
      },
      {
        title: "Availability and closing your account",
        content: "Brewed is provided as available; features and café information may change. You can stop using Brewed and delete your account in Settings → Security. The Privacy Policy explains what account deletion removes and which café information may remain. These terms do not remove rights you have under applicable law.",
      },
      {
        title: "Policy updates",
        content: "Updates to these terms or the Privacy Policy will be published on these pages with a revised effective date. Brewed records the policy version and date accepted when an account is created.",
      },
    ],
  },
};

function PolicyPage({ type }) {
  const policy = policies[type];

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-8 md:px-8 md:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 pb-6">
        <Link to="/" aria-label="Brewed home"><Logo size="lg" /></Link>
        <nav aria-label="Policies" className="flex gap-4 text-sm">
          <Link to="/privacy" aria-current={type === "privacy" ? "page" : undefined} className="text-accent underline underline-offset-4">
            Privacy Policy
          </Link>
          <Link to="/terms" aria-current={type === "terms" ? "page" : undefined} className="text-accent underline underline-offset-4">
            Terms and Conditions
          </Link>
        </nav>
      </header>
      <main className="py-10">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">{policy.title}</h1>
        <p className="mt-3 text-sm text-secondary">Effective <time dateTime="2026-10-20">October 20, 2026</time></p>
        <p className="mt-6 leading-relaxed">{policy.introduction}</p>
        <div className="mt-9 space-y-8">
          {policy.sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 leading-relaxed text-secondary">{section.content}</p>
            </section>
          ))}
          <section>
            <h2 className="font-display text-xl font-semibold">Contact us</h2>
            <p className="mt-3 leading-relaxed text-secondary">
              For questions about {type === "privacy" ? "your personal information or this policy" : "Brewed or these terms"},
              contact the Brewed team at{" "}
              <a href="mailto:webiverselabs@gmail.com" className="break-all text-accent underline underline-offset-2">
                webiverselabs@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 pt-4 text-[13px] text-secondary">
        <div className="flex flex-wrap items-center gap-1.5">
          <CopyDeveloperEmailButton />
          <span>© 2026 Webiverse Labs. All rights reserved.</span>
        </div>
        <div className="flex gap-4">
          <Link to="/signup" className="font-medium text-accent hover:underline">Sign Up</Link>
          <Link to="/login" className="text-secondary hover:underline">Log In</Link>
        </div>
      </footer>
    </div>
  );
}

export default PolicyPage;
