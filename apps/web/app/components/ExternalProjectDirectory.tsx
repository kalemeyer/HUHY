import { externalProjectCatalog } from "../data";
import { RiskPill } from "./RiskPill";

export function ExternalProjectDirectory() {
  return (
    <section className="external-projects" aria-labelledby="external-projects-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">EXTERNAL PROJECT LEADS</p>
          <h2 id="external-projects-heading">Useful work that already exists</h2>
        </div>
        <p>
          These repositories show activity within the last 18 months and a visible
          contribution path. They belong to their existing owners; listing is not
          endorsement, adoption, or confirmation that maintainers can accept help.
        </p>
      </div>
      <div className="project-grid">
        {externalProjectCatalog.map((project) => (
          <article className="project-card external-project-card" key={project.id}>
            <div>
              <span>{project.repositoryStatus.toUpperCase()}</span>
              <RiskPill value={project.risk} />
            </div>
            <span className="ownership-badge">NOT A HUHY-OWNED PROJECT</span>
            <h3>{project.name}</h3>
            <p>{project.summary}</p>
            <dl>
              <dt>Existing owner</dt><dd>{project.owner}</dd>
              <dt>Observed license</dt><dd>{project.license}</dd>
              <dt>Contribution signal</dt><dd>{project.contributionSignal}</dd>
              <dt>Last repository activity</dt><dd>{project.lastActivity}</dd>
              <dt>HUHY caution</dt><dd>{project.note}</dd>
              <dt>Evidence checked</dt><dd>{project.evidenceAsOf}</dd>
            </dl>
            <a className="project-action" href={project.github} target="_blank" rel="noreferrer">
              Review the owner&apos;s repository <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
