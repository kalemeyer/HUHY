"use client";

import { useEffect, useMemo, useState } from "react";
import { RiskPill } from "../components/RiskPill";

export type BoardSubmission = {
  id: string;
  problem: string;
  people: string;
  better: string;
  status: string;
  sourceStatus: string;
  risk: string;
  maintainer: string;
  contributorNeeds: string;
  maintenanceStatus: string;
  reviewCadence: string;
  githubUrl: string | null;
  githubUpdatedAt: string | null;
  dispositionReason: string | null;
  reopeningCondition: string | null;
};
const statuses = [
  "Submitted",
  "Clarifying",
  "Researching",
  "Ready for Decision",
  "Approved for Incubation",
  "Building",
  "Released",
  "Not Now",
  "Referred",
  "Declined",
];

export function ProblemBoard() {
  const [filter, setFilter] = useState("All work");
  const [records, setRecords] = useState<BoardSubmission[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/submissions?scope=board", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        if (active) {
          setRecords(payload.submissions ?? []);
          setError("");
          setRefreshedAt(new Date());
        }
      } catch {
        if (active) setError("The problem board could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = setInterval(load, 300000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const filtered = useMemo(
    () =>
      records.filter(
        (card) =>
          filter === "All work" ||
          (filter === "In progress" &&
            [
              "Clarifying",
              "Researching",
              "Ready for Decision",
              "Approved for Incubation",
              "Building",
            ].includes(card.status)) ||
          (filter === "Needs people" &&
            (/needed|unassigned/i.test(card.maintainer) ||
              !/not defined|none/i.test(card.contributorNeeds))),
      ),
    [records, filter],
  );
  return (
    <>
      <div className="board-page-tools">
        <p>
          Safety-reviewed public briefs appear here. GitHub-backed projects
          refresh at most every five minutes.
          {refreshedAt && (
            <small>
              {" "}
              Last checked{" "}
              {refreshedAt.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              })}
              .
            </small>
          )}
        </p>
        <div
          className="segmented"
          role="group"
          aria-label="Filter problem board"
        >
          {["All work", "In progress", "Needs people"].map((item) => (
            <button
              className={filter === item ? "active" : ""}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="board-load-message">{error}</p>}
      <div className="kanban" aria-label="HUHY Kanban board">
        {statuses.map((status) => {
          const cards = filtered.filter((card) => card.status === status);
          return (
            <section className="board-column" key={status}>
              <div className="column-heading">
                <span
                  className={`status-dot status-${status.toLowerCase().replaceAll(" ", "-")}`}
                />
                <h3>{status}</h3>
                <span>{cards.length}</span>
              </div>
              {cards.map((card) => (
                <article className="problem-card" key={card.id}>
                  <div className="card-top">
                    <span className="card-id">{card.id}</span>
                    <RiskPill value={card.risk} />
                  </div>
                  <h4>{card.problem}</h4>
                  <p>{card.better}</p>
                  <dl>
                    <div>
                      <dt>Who it affects</dt>
                      <dd>{card.people}</dd>
                    </div>
                    <div>
                      <dt>Public source status</dt>
                      <dd>{card.sourceStatus}</dd>
                    </div>
                    <div>
                      <dt>Contributors needed</dt>
                      <dd>{card.contributorNeeds}</dd>
                    </div>
                    <div>
                      <dt>Maintenance</dt>
                      <dd>
                        {card.maintenanceStatus} · {card.maintainer}
                      </dd>
                    </div>
                    <div>
                      <dt>GitHub destination</dt>
                      <dd className="placeholder-link">
                        {card.githubUrl ? (
                          <a
                            href={card.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open source-of-truth issue ↗
                          </a>
                        ) : (
                          "Not created · safety review continues"
                        )}
                      </dd>
                    </div>
                  </dl>
                  {card.dispositionReason && (
                    <div className="disposition-note">
                      Reason · {card.dispositionReason}
                      {card.reopeningCondition && (
                        <>
                          <br />
                          Reopening condition · {card.reopeningCondition}
                        </>
                      )}
                    </div>
                  )}
                  <small>
                    {card.githubUrl
                      ? "LIVE GITHUB-BACKED RECORD"
                      : "PUBLIC HUHY RECORD · GITHUB NOT YET CREATED"}
                  </small>
                </article>
              ))}
              {!cards.length && !loading && (
                <p className="column-empty">No live records</p>
              )}
            </section>
          );
        })}
      </div>
      <p className="board-footnote">
        <strong>Before records appear here:</strong> they stay in a private
        safety queue. Approved projects become public GitHub issues; GitHub
        status labels then drive the board. Only the named HUHY Steward may mark
        a viable proposal Declined, with a reason and reopening condition.
      </p>
    </>
  );
}
