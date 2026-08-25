import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";

const destinations = [
  {
    number: "01",
    eyebrow: "HUHY BOARD",
    title: "Review submitted problems",
    text: "See safety-reviewed proposals move through research, decision, development, release, referral, or deferral.",
    href: "/problems",
    action: "Open the problem board",
  },
  {
    number: "02",
    eyebrow: "SUGGEST A PROBLEM",
    title: "Describe a recurring problem",
    text: "Send a public, non-sensitive problem for safety review. No account, proposed solution, or technical background is required.",
    href: "/suggest",
    action: "Suggest a problem",
  },
  {
    number: "03",
    eyebrow: "FIND A TOOL",
    title: "Check existing tools first",
    text: "Search the research catalog by topic, source, lifecycle, and maintenance status.",
    href: "/tools",
    action: "Search the directory",
  },
  {
    number: "04",
    eyebrow: "CONTRIBUTE",
    title: "See how contributors work",
    text: "Projects can use research, design, writing, testing, engineering, subject knowledge, and maintenance.",
    href: "/build",
    action: "Review the build process",
  },
  {
    number: "05",
    eyebrow: "OPEN PROJECTS",
    title: "Review projects that need help",
    text: "See approved projects with their requested roles, source basis, risk, and current stage.",
    href: "/projects",
    action: "View projects",
  },
  {
    number: "06",
    eyebrow: "MAINTENANCE",
    title: "Review ownership gaps",
    text: "See projects that need primary, backup, accessibility, or source-review maintainers.",
    href: "/maintainers",
    action: "View maintainer needs",
  },
];

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="hero home-hero" id="top">
        <div className="air-grid" aria-hidden="true">
          <span>34°N</span>
          <span>PUBLIC INFORMATION ONLY</span>
          <span>117°W</span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">
            PROBLEM INTAKE · TOOL DISCOVERY · OPEN DEVELOPMENT
          </p>
          <h1>Raise a problem. Find a tool. Help build what&apos;s missing.</h1>
          <p className="hero-lede">
            HUHY turns public, non-sensitive problems Airmen face into visible
            work. Submit a problem, check existing tools, or help build and
            maintain something useful.
          </p>
          <div className="hero-actions">
            <a className="button" href="/suggest">
              Suggest a problem
            </a>
            <a className="text-link" href="/problems">
              View the problem board <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <aside
          className="promise-card"
          aria-label="What happens after submission"
        >
          <p className="eyebrow">HELP US HELP YOU</p>
          <p>Every safe submission receives a visible status.</p>
          <div className="promise-rule" />
          <span>
            Triage may request details, research the need, combine related
            proposals, refer the submitter, or defer the work—with a reason.
          </span>
        </aside>
      </section>
      <section
        className="boundary-band"
        aria-label="Public information boundary"
      >
        <div className="boundary-icon">!</div>
        <div>
          <strong>PUBLICLY RELEASED, UNCLASSIFIED INFORMATION ONLY.</strong>
          <p>
            Do not include CAC data, .mil-only APIs, PII, PHI, CUI, operational
            or readiness data, credentials, internal screenshots, or sensitive
            uploads.
          </p>
        </div>
        <a href="/community">Review the rules</a>
      </section>
      <section className="mission-strip" aria-label="Air Force life areas">
        <div>
          <span>01</span>
          <strong>PCS &amp; family support</strong>
        </div>
        <div>
          <span>02</span>
          <strong>Publications &amp; admin</strong>
        </div>
        <div>
          <span>03</span>
          <strong>Training &amp; development</strong>
        </div>
        <div>
          <span>04</span>
          <strong>Benefits &amp; transition</strong>
        </div>
        <div>
          <span>05</span>
          <strong>Builder infrastructure</strong>
        </div>
      </section>
      <section className="home-map">
        <div className="section-heading">
          <div>
            <p className="eyebrow">START HERE</p>
            <h2>Choose what you need.</h2>
          </div>
          <p>Each part of HUHY has a focused page.</p>
        </div>
        <div className="destination-grid">
          {destinations.map((item) => (
            <a className="destination-card" href={item.href} key={item.href}>
              <div>
                <span>{item.number}</span>
                <small>{item.eyebrow}</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <strong>
                {item.action} <span aria-hidden="true">→</span>
              </strong>
            </a>
          ))}
        </div>
      </section>
      <section className="home-principle">
        <div>
          <p className="eyebrow">INDEPENDENT AND UNOFFICIAL</p>
          <h2>Existing projects remain with their owners.</h2>
        </div>
        <div>
          <p>
            HUHY can point people to existing work, refer contributors, or
            contribute upstream when invited. It does not claim another
            community&apos;s projects, repositories, or identity.
          </p>
          <a href="/community">
            Read the community rules <span>→</span>
          </a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
