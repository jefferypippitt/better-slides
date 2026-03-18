import Link from "next/link";

const privacySections = [
  {
    title: "Information We Collect",
    paragraphs: [
      "We collect the email address and profile details you provide when creating an account, along with basic usage data needed to operate the service.",
      "When you upload MDX files, those files are stored and are readable by our team for support and moderation purposes. They are not encrypted at rest. Do not upload files containing sensitive or confidential information.",
    ],
  },
  {
    title: "How We Use Information",
    paragraphs: [
      "We use your information to authenticate your account, deliver product features, keep the platform secure, and send important service updates. We do not sell your data or use it for advertising.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "We use session cookies to keep you signed in. These are strictly necessary and cannot be disabled without breaking authentication. We do not use third-party tracking or advertising cookies.",
    ],
  },
  {
    title: "Data Sharing",
    paragraphs: [
      "We do not sell your personal information. We may share data with infrastructure providers who help us run Better Slides, under confidentiality obligations. We may also disclose data when required by law.",
    ],
  },
  {
    title: "Data Retention",
    paragraphs: [
      "We retain your data for as long as your account is active. You can request account deletion at any time, and we will remove your data within 30 days except where retention is required by law.",
    ],
  },
  {
    title: "Your Choices",
    paragraphs: ["You can at any time:"],
    bullets: [
      "Update or correct your account details.",
      "Request a copy of your data.",
      "Request account deletion and removal of associated data.",
    ],
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this policy from time to time. We will update the effective date above and notify you of significant changes by email or in-app notice.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "For privacy questions or requests, please contact us through the support channel in the app.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <div className="fixed bottom-6 left-6 flex flex-col gap-0.5 font-mono text-[10px] tracking-[0.12em]">
        <span className="text-muted-foreground">LEGAL</span>
        <Link
          className="text-foreground transition-colors hover:text-muted-foreground"
          href="/terms"
        >
          TERMS
        </Link>
      </div>
      <article className="mx-auto max-w-4xl space-y-10">
        <div className="space-y-3 border-border border-b pb-8">
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.12em]">
            EFFECTIVE DATE: MARCH 17, 2026
          </p>
          <h1 className="font-bold text-[clamp(2rem,6vw,3rem)] leading-[0.92] tracking-tight">
            Privacy
            <br />
            Policy
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This policy explains what data we collect and how we protect it.
          </p>
        </div>

        <div className="space-y-8">
          {privacySections.map((section) => (
            <section
              className="grid gap-3 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-10"
              key={section.title}
            >
              <h2 className="font-semibold text-lg tracking-tight">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p
                    className="text-muted-foreground text-sm leading-relaxed"
                    key={paragraph}
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm leading-relaxed">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </article>
    </>
  );
}
