import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "GitHub Starter Guide · HUHY",
  description:
    "A plain-language guide to joining a HUHY project, with or without coding experience.",
  openGraph: {
    title: "GitHub Starter Guide · HUHY",
    description: "Join a HUHY project without needing prior GitHub experience.",
    images: [],
  },
  twitter: {
    title: "GitHub Starter Guide · HUHY",
    description: "Join a HUHY project without needing prior GitHub experience.",
    images: [],
  },
};

const noCodeSteps = [
  [
    "Create a free GitHub account",
    "Use a personal account. You do not need a government email, CAC, or special access.",
  ],
  [
    "Choose a HUHY project",
    "Open Projects Seeking Contributors and pick a problem that lists a role you can help with.",
  ],
  [
    "Open the project issue",
    "The issue is the public conversation for that project. Read the problem, sources, risk, and requested help.",
  ],
  [
    "Leave a comment",
    "Say which role you can fill and suggest one small first task. A project lead can help shape the next step.",
  ],
];

const codeSteps = [
  [
    "Start with the project issue",
    "Comment before writing code so the team can confirm the task is useful and not already underway.",
  ],
  [
    "Fork the repository",
    "A fork is your own GitHub copy. It lets you work safely without changing the main project.",
  ],
  [
    "Make one focused change",
    "GitHub's browser editor is enough for many documentation and small code changes. A command line is optional.",
  ],
  [
    "Open a pull request",
    "A pull request asks the maintainers to review your change. Link the project issue and explain what you tested.",
  ],
  [
    "Respond to review",
    "Questions and requested changes are normal. The contribution is not merged until a maintainer approves it.",
  ],
];

const terms = [
  ["Repository", "The project folder on GitHub: code, documents, history, and rules."],
  ["Issue", "A public discussion used to define a problem, task, question, or decision."],
  ["Fork", "Your personal copy of a repository."],
  ["Branch", "A separate line of work inside a repository or fork."],
  ["Commit", "A saved set of changes with a short explanation."],
  ["Pull request", "A request for maintainers to review and possibly merge your changes."],
  ["Maintainer", "A person responsible for review, releases, upkeep, and a defined area of ownership."],
];

export default function GitHubGuidePage() {
  return (
    <main>
      <SiteHeader />
      <section className="page-hero page-hero-dark github-guide-hero">
        <p className="eyebrow">FIRST-TIME CONTRIBUTOR GUIDE</p>
        <h1>New to GitHub? Start here.</h1>
        <p>
          You do not need to be a coder or understand Git commands to help. Use
          this guide to join a project, make a small contribution, or volunteer
          for maintenance.
        </p>
        <div className="guide-hero-actions">
          <a className="button" href="https://github.com/signup" target="_blank" rel="noreferrer">
            Create a GitHub account ↗
          </a>
          <a href="/projects">Browse HUHY projects →</a>
        </div>
      </section>

      <section className="github-boundary" aria-label="GitHub safety boundary">
        <strong>GitHub is public.</strong>
        <p>
          Use publicly released, non-sensitive information only. Never post PII,
          PHI, CUI, credentials, internal screenshots, readiness or operational
          information, or material from a restricted system.
        </p>
      </section>

      <section className="github-guide-content">
        <div className="guide-paths">
          <article className="guide-path-card">
            <p className="eyebrow">NO CODE REQUIRED</p>
            <h2>Help with research, writing, testing, design, or experience</h2>
            <ol>
              {noCodeSteps.map(([title, detail], index) => (
                <li key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>

          <article className="guide-path-card guide-path-card-code">
            <p className="eyebrow">CODE OR DOCUMENT CHANGES</p>
            <h2>Make a change through review</h2>
            <ol>
              {codeSteps.map(([title, detail], index) => (
                <li key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </div>

        <section className="volunteer-template">
          <div>
            <p className="eyebrow">COPY THIS INTO A PROJECT ISSUE</p>
            <h2>A simple introduction is enough.</h2>
            <p>
              Do not post a résumé, personal details, duty information, or
              anything that is not already public.
            </p>
          </div>
          <pre>{`I'd like to help with: [role or task]\n\nI can contribute: [brief public description]\n\nA good first task for me could be: [small starting point]\n\nAvailability: [one-time help or ongoing]\n\nI confirm I will use public, non-sensitive information only.`}</pre>
        </section>

        <section className="maintainer-path">
          <div>
            <p className="eyebrow">BECOMING A MAINTAINER</p>
            <h2>Maintenance is a commitment, not a title.</h2>
          </div>
          <ol>
            <li>Volunteer on the project issue and name the area you can own.</li>
            <li>State your realistic availability and whether backup is needed.</li>
            <li>Review the project&apos;s risk, source, release, and support expectations.</li>
            <li>The project lead or HUHY Steward confirms and records the ownership.</li>
          </ol>
          <a href="/maintainers">View projects needing maintainers →</a>
        </section>

        <section className="github-terms">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PLAIN-LANGUAGE GLOSSARY</p>
              <h2>What the GitHub words mean</h2>
            </div>
          </div>
          <dl>
            {terms.map(([term, definition]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="guide-help">
          <div>
            <p className="eyebrow">STILL NOT SURE?</p>
            <h2>Ask before you start.</h2>
            <p>
              Questions are welcome. Describe the kind of help you want to
              offer—without including sensitive information—and someone can
              point you toward an appropriate first step.
            </p>
          </div>
          <a className="button" href="https://github.com/kalemeyer/HUHY/discussions" target="_blank" rel="noreferrer">
            Ask in GitHub Discussions ↗
          </a>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
