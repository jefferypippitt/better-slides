import Link from "next/link";

const termsSections = [
  {
    title: "Acceptance of Terms",
    paragraphs: [
      "By creating an account and using Better Slides, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the service.",
      "We may update these terms from time to time. Continued use after changes take effect constitutes acceptance.",
    ],
  },
  {
    title: "Your Account",
    paragraphs: [
      "You are responsible for keeping your credentials secure and for all activity under your account. You must provide accurate information and keep it up to date.",
      "You must be at least 13 years old to use Better Slides.",
    ],
  },
  {
    title: "Content and Usage",
    paragraphs: [
      "You retain ownership of the content you create. By using Better Slides you grant us a limited license to host and process that content to operate the service.",
      "Uploaded MDX files are stored and are readable by our team. Do not upload sensitive, confidential, or proprietary information. You agree not to:",
    ],
    bullets: [
      "Upload illegal, abusive, or malicious material.",
      "Upload content containing personal data, passwords, API keys, or other sensitive information.",
      "Attempt to disrupt or reverse-engineer the service.",
      "Infringe on the rights of others.",
    ],
  },
  {
    title: "Pricing & Billing",
    paragraphs: [
      "Better Slides is currently free to use. We may introduce paid plans in the future. If we do, we will notify you in advance and you will not be charged without your explicit consent.",
    ],
  },
  {
    title: "Service Availability",
    paragraphs: [
      "We may update, suspend, or discontinue parts of the service at any time. We aim for reliability but do not guarantee uninterrupted availability.",
    ],
  },
  {
    title: "Termination",
    paragraphs: [
      "You may stop using Better Slides and request account deletion at any time. We may suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      'Better Slides is provided on an "as-is" basis. To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the service.',
    ],
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These terms are governed by the laws of the United States. If any provision is found unenforceable, the remaining provisions remain in effect.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Questions about these terms? Reach us through the support channel in the app.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <div className="fixed bottom-6 left-6 flex flex-col gap-0.5 font-mono text-[10px] tracking-[0.12em]">
        <span className="text-muted-foreground">LEGAL</span>
        <Link
          className="text-foreground transition-colors hover:text-muted-foreground"
          href="/privacy"
        >
          PRIVACY
        </Link>
      </div>
      <article className="mx-auto max-w-4xl space-y-10">
        <div className="space-y-3 border-border border-b pb-8">
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.12em]">
            EFFECTIVE DATE: MARCH 17, 2026
          </p>
          <h1 className="font-bold text-[clamp(2rem,6vw,3rem)] leading-[0.92] tracking-tight">
            Terms of
            <br />
            Service
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            These terms explain your rights and responsibilities when using
            Better Slides.
          </p>
        </div>

        <div className="space-y-8">
          {termsSections.map((section) => (
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
