"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Submission = {
  id: string;
  problem: string;
  people: string;
  currentToday: string;
  better: string;
  frequency: string;
  existingTool: string | null;
  publicProblem: string | null;
  publicPeople: string | null;
  publicCurrentToday: string | null;
  publicBetter: string | null;
  publicFrequency: string | null;
  publicExistingTool: string | null;
  publicBriefApprovedAt: string | null;
  status: string;
  sourceStatus: string;
  risk: string;
  maintainer: string;
  contributorNeeds: string;
  maintenanceStatus: string;
  reviewCadence: string;
  githubUrl: string | null;
  dispositionReason: string | null;
  reopeningCondition: string | null;
  createdAt: string;
  updatedAt: string;
};
type GitHubStatus = {
  connected: boolean;
  configured: boolean;
  repository: string;
  url: string;
  authMode: string;
  syncMode: string;
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

async function readJson(response: Response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error);
  return payload;
}

export function StewardConsole() {
  const [records, setRecords] = useState<Submission[]>([]);
  const [user, setUser] = useState<{
    displayName: string;
    role: string;
  } | null>(null);
  const [github, setGithub] = useState<GitHubStatus | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const applyPayloads = useCallback(
    (
      submissions: {
        submissions: Submission[];
        user: { displayName: string; role: string };
      },
      connection: GitHubStatus,
    ) => {
      setRecords(submissions.submissions ?? []);
      setUser(submissions.user);
      setGithub(connection);
      setError("");
    },
    [],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [submissions, connection] = await Promise.all([
        fetch("/api/submissions", { cache: "no-store" }).then(readJson),
        fetch("/api/github/status", { cache: "no-store" }).then(readJson),
      ]);
      applyPayloads(submissions, connection);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load the steward queue.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyPayloads]);
  useEffect(() => {
    void Promise.all([
      fetch("/api/submissions", { cache: "no-store" }).then(readJson),
      fetch("/api/github/status", { cache: "no-store" }).then(readJson),
    ])
      .then(([submissions, connection]) =>
        applyPayloads(submissions, connection),
      )
      .catch((error: unknown) =>
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load the steward queue.",
        ),
      )
      .finally(() => setLoading(false));
  }, [applyPayloads]);
  async function save(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSaving(id);
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: data.get("status"),
          publicProblem: data.get("publicProblem"),
          publicPeople: data.get("publicPeople"),
          publicCurrentToday: data.get("publicCurrentToday"),
          publicBetter: data.get("publicBetter"),
          publicFrequency: data.get("publicFrequency"),
          publicExistingTool: data.get("publicExistingTool"),
          publicBriefConfirmed: data.get("publicBriefConfirmed") === "on",
          sourceStatus: data.get("sourceStatus"),
          risk: data.get("risk"),
          maintainer: data.get("maintainer"),
          contributorNeeds: data.get("contributorNeeds"),
          maintenanceStatus: data.get("maintenanceStatus"),
          reviewCadence: data.get("reviewCadence"),
          reason: data.get("reason"),
          reopeningCondition: data.get("reopeningCondition"),
          publishToGitHub: data.get("publishToGitHub") === "on",
        }),
      });
      const payload = await readJson(response);
      setNotice(payload.message);
      await load();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save the disposition.",
      );
    } finally {
      setSaving("");
    }
  }
  const canTriage = user?.role === "steward" || user?.role === "triager";
  return (
    <>
      <div className="steward-summary">
        <div>
          <span>SIGNED IN</span>
          <strong>{user?.displayName ?? "Loading…"}</strong>
          <small>{user?.role ?? ""}</small>
        </div>
        <div>
          <span>PRIVATE QUEUE</span>
          <strong>
            {
              records.filter((record) => record.status === "Pending review")
                .length
            }
          </strong>
          <small>awaiting safety review</small>
        </div>
        <div
          className={
            github?.connected ? "connection-live" : "connection-waiting"
          }
        >
          <span>GITHUB APP</span>
          <strong>{github?.connected ? "Connected" : "Not installed"}</strong>
          <small>
            {github ? (
              <a href={github.url} target="_blank" rel="noreferrer">
                {github.repository}
              </a>
            ) : (
              "Checking…"
            )}
          </small>
        </div>
      </div>
      {notice && (
        <p className="submission-result" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="submission-result submission-error" role="alert">
          {error}
        </p>
      )}
      {!github?.connected && !loading && (
        <div className="connection-note">
          <strong>
            The repository is ready, but automatic publishing is locked.
          </strong>
          <p>
            Create and install the private HUHY GitHub App on{" "}
            <code>{github?.repository}</code> with Issues read/write access.
            HUHY stores only the app identifiers and private signing key, then
            uses short-lived installation tokens.
          </p>
        </div>
      )}
      {loading && <p className="empty-state">Loading the private queue…</p>}
      {!loading && !records.length && (
        <p className="empty-state">No submissions yet.</p>
      )}
      <div className="steward-list">
        {records.map((record) => (
          <article className="steward-card" key={record.id}>
            <div className="steward-card-heading">
              <div>
                <span>
                  {record.id} · {record.status}
                </span>
                <h2>{record.problem}</h2>
                {record.githubUrl && (
                  <a
                    className="github-record-link"
                    href={record.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open GitHub issue ↗
                  </a>
                )}
              </div>
              <small>
                {new Date(record.createdAt + "Z").toLocaleDateString()}
              </small>
            </div>
            <dl>
              <div>
                <dt>Who experiences it</dt>
                <dd>{record.people}</dd>
              </div>
              <div>
                <dt>What happens today</dt>
                <dd>{record.currentToday}</dd>
              </div>
              <div>
                <dt>Better outcome</dt>
                <dd>{record.better}</dd>
              </div>
              <div>
                <dt>Frequency</dt>
                <dd>{record.frequency}</dd>
              </div>
              {record.existingTool && (
                <div>
                  <dt>Existing public tool</dt>
                  <dd>{record.existingTool}</dd>
                </div>
              )}
            </dl>
            {canTriage && (
              <form
                className="disposition-form"
                key={`${record.id}-${record.updatedAt}`}
                onSubmit={(event) => save(event, record.id)}
              >
                <div className="public-brief-editor">
                  <div>
                    <span>SEPARATE PUBLIC BRIEF</span>
                    <strong>
                      Rewrite or remove anything that should remain in the
                      private intake record.
                    </strong>
                    <small>
                      The public board and GitHub use only these fields after
                      you confirm them.
                    </small>
                  </div>
                  <label>
                    Public problem
                    <textarea
                      name="publicProblem"
                      required
                      minLength={20}
                      maxLength={500}
                      defaultValue={record.publicProblem ?? record.problem}
                    />
                  </label>
                  <label>
                    Public audience
                    <input
                      name="publicPeople"
                      required
                      minLength={3}
                      maxLength={160}
                      defaultValue={record.publicPeople ?? record.people}
                    />
                  </label>
                  <label>
                    Public current process
                    <textarea
                      name="publicCurrentToday"
                      required
                      minLength={10}
                      maxLength={500}
                      defaultValue={
                        record.publicCurrentToday ?? record.currentToday
                      }
                    />
                  </label>
                  <label>
                    Public better outcome
                    <textarea
                      name="publicBetter"
                      required
                      minLength={10}
                      maxLength={320}
                      defaultValue={record.publicBetter ?? record.better}
                    />
                  </label>
                  <label>
                    Frequency
                    <select
                      name="publicFrequency"
                      defaultValue={record.publicFrequency ?? record.frequency}
                    >
                      {[
                        "Occasionally",
                        "Monthly",
                        "Weekly",
                        "Daily",
                        "Not sure",
                      ].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Existing public tool or process
                    <input
                      name="publicExistingTool"
                      maxLength={240}
                      defaultValue={
                        record.publicExistingTool ?? record.existingTool ?? ""
                      }
                    />
                  </label>
                  <label className="github-publish-check public-brief-check">
                    <input
                      name="publicBriefConfirmed"
                      type="checkbox"
                      required
                    />
                    <span>
                      I reviewed this exact public brief. It contains only
                      publicly released, non-sensitive information and may
                      appear on the public board.
                    </span>
                  </label>
                </div>
                <label>
                  Disposition
                  <select
                    name="status"
                    defaultValue={
                      record.status === "Pending review"
                        ? "Submitted"
                        : record.status
                    }
                  >
                    {statuses.map((status) => (
                      <option
                        key={status}
                        disabled={
                          status === "Declined" && user?.role !== "steward"
                        }
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Public source status
                  <input
                    name="sourceStatus"
                    maxLength={160}
                    defaultValue={record.sourceStatus}
                  />
                </label>
                <label>
                  Risk
                  <select name="risk" defaultValue={record.risk}>
                    {["Unreviewed", "Low", "Medium", "High"].map((risk) => (
                      <option key={risk}>{risk}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Maintainer
                  <input
                    name="maintainer"
                    maxLength={160}
                    defaultValue={record.maintainer}
                  />
                </label>
                <label>
                  Contributors needed
                  <input
                    name="contributorNeeds"
                    maxLength={240}
                    defaultValue={record.contributorNeeds}
                    placeholder="Example: source review · design · TypeScript"
                  />
                </label>
                <label>
                  Maintenance status
                  <select
                    name="maintenanceStatus"
                    defaultValue={record.maintenanceStatus}
                  >
                    {[
                      "Maintainer needed",
                      "Primary maintainer needed",
                      "Backup maintainer needed",
                      "Maintained",
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Review cadence
                  <input
                    name="reviewCadence"
                    maxLength={120}
                    defaultValue={record.reviewCadence}
                    placeholder="Example: Quarterly and after source changes"
                  />
                </label>
                <label>
                  Reason
                  <textarea
                    name="reason"
                    maxLength={600}
                    defaultValue={record.dispositionReason ?? ""}
                    placeholder="Required for Not Now, Referred, or Declined"
                  />
                </label>
                <label>
                  Reopening condition
                  <textarea
                    name="reopeningCondition"
                    maxLength={600}
                    defaultValue={record.reopeningCondition ?? ""}
                    placeholder="Required when Declined"
                  />
                </label>
                {!record.githubUrl && (
                  <label className="github-publish-check">
                    <input
                      name="publishToGitHub"
                      type="checkbox"
                      disabled={!github?.connected}
                    />
                    <span>
                      When approving for incubation, publish this reviewed
                      public brief through the GitHub App.
                    </span>
                  </label>
                )}
                <button
                  className="button button-small"
                  disabled={saving === record.id}
                >
                  {saving === record.id ? "Saving…" : "Save disposition"}
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
