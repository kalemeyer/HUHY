import { env } from "cloudflare:workers";

export const GITHUB_STATUS_LABELS: Record<string, string> = {
  Submitted: "huhy:submitted",
  Clarifying: "huhy:clarifying",
  Researching: "huhy:researching",
  "Ready for Decision": "huhy:ready-for-decision",
  "Approved for Incubation": "huhy:approved-for-incubation",
  Building: "huhy:building",
  Released: "huhy:released",
  "Not Now": "huhy:not-now",
  Referred: "huhy:referred",
  Declined: "huhy:declined",
};

const statusByLabel = new Map(
  Object.entries(GITHUB_STATUS_LABELS).map(([status, label]) => [
    label,
    status,
  ]),
);

export type SyncableSubmission = {
  id: string;
  problem: string;
  people: string;
  currentToday: string;
  better: string;
  frequency: string;
  existingTool: string | null;
  status: string;
  sourceStatus: string;
  risk: string;
  maintainer: string;
  contributorNeeds: string;
  maintenanceStatus: string;
  reviewCadence: string;
  githubUrl: string | null;
  githubIssueNumber: number | null;
  githubUpdatedAt: string | null;
  githubCheckedAt: string | null;
};

type GitHubIssue = {
  number: number;
  html_url: string;
  updated_at: string;
  labels: Array<string | { name?: string }>;
};

export class GitHubConnectionError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

export function getGitHubConfig() {
  const owner = (env.GITHUB_OWNER ?? "kalemeyer").trim();
  const repo = (env.GITHUB_REPO ?? "HUHY").trim();
  const clientId = env.GITHUB_APP_CLIENT_ID?.trim();
  const installationId = Number(env.GITHUB_APP_INSTALLATION_ID);
  const privateKey = env.GITHUB_APP_PRIVATE_KEY?.trim();
  return {
    owner,
    repo,
    clientId,
    installationId,
    privateKey,
    repository: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
    configured: Boolean(
      owner &&
      repo &&
      clientId &&
      Number.isInteger(installationId) &&
      installationId > 0 &&
      privateKey,
    ),
    authMode: "GitHub App installation",
  };
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(
    parts.reduce((total, part) => total + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
function derLength(length: number): Uint8Array {
  if (length < 128) return new Uint8Array([length]);
  const bytes: number[] = [];
  for (let value = length; value > 0; value >>= 8) bytes.unshift(value & 255);
  return new Uint8Array([128 | bytes.length, ...bytes]);
}
function wrapPkcs1AsPkcs8(pkcs1: Uint8Array): Uint8Array {
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const rsaAlgorithm = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01,
    0x01, 0x05, 0x00,
  ]);
  const octet = concatBytes(
    new Uint8Array([0x04]),
    derLength(pkcs1.length),
    pkcs1,
  );
  const body = concatBytes(version, rsaAlgorithm, octet);
  return concatBytes(new Uint8Array([0x30]), derLength(body.length), body);
}
function pemBytes(pem: string): Uint8Array {
  const normalized = pem.replace(/\\n/g, "\n");
  const pkcs1 = normalized.includes("BEGIN RSA PRIVATE KEY");
  const base64 = normalized.replace(
    /-----BEGIN (RSA )?PRIVATE KEY-----|-----END (RSA )?PRIVATE KEY-----|\s/g,
    "",
  );
  const bytes = Uint8Array.from(atob(base64), (character) =>
    character.charCodeAt(0),
  );
  return pkcs1 ? wrapPkcs1AsPkcs8(bytes) : bytes;
}
function base64Url(input: Uint8Array): string {
  let binary = "";
  for (const byte of input) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
async function createAppJwt(
  clientId: string,
  privateKey: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const header = base64Url(
    encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })),
  );
  const payload = base64Url(
    encoder.encode(
      JSON.stringify({ iat: now - 60, exp: now + 540, iss: clientId }),
    ),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBytes(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

let installationTokenCache: { token: string; expiresAt: number } | null = null;
async function getInstallationToken(): Promise<string> {
  if (
    installationTokenCache &&
    installationTokenCache.expiresAt > Date.now() + 60_000
  )
    return installationTokenCache.token;
  const config = getGitHubConfig();
  if (!config.configured || !config.clientId || !config.privateKey)
    throw new GitHubConnectionError(
      "The HUHY GitHub App is not installed and configured yet.",
      503,
    );
  let jwt: string;
  try {
    jwt = await createAppJwt(config.clientId, config.privateKey);
  } catch {
    throw new GitHubConnectionError(
      "The HUHY GitHub App private key could not be used.",
      503,
    );
  }
  const response = await fetch(
    `https://api.github.com/app/installations/${config.installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${jwt}`,
        "content-type": "application/json",
        "user-agent": "HUHY-public-beta",
        "x-github-api-version": "2026-03-10",
      },
      body: JSON.stringify({
        repositories: [config.repo],
        permissions: { issues: "write" },
      }),
    },
  );
  if (!response.ok)
    throw new GitHubConnectionError(
      response.status === 401 ||
        response.status === 403 ||
        response.status === 404
        ? "The HUHY GitHub App installation or permissions are not valid."
        : `GitHub did not issue an installation token (${response.status}).`,
      503,
    );
  const data = (await response.json()) as { token: string; expires_at: string };
  installationTokenCache = {
    token: data.token,
    expiresAt: new Date(data.expires_at).getTime(),
  };
  return data.token;
}

async function githubRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getGitHubConfig();
  const token = await getInstallationToken();
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}${path}`,
    {
      ...init,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "HUHY-public-beta",
        "x-github-api-version": "2026-03-10",
        ...init.headers,
      },
    },
  );
  if (!response.ok)
    throw new GitHubConnectionError(
      response.status === 401 || response.status === 403
        ? "The HUHY GitHub App lacks the required repository Issues access."
        : `GitHub did not accept the request (${response.status}).`,
      response.status === 401 || response.status === 403 ? 503 : 502,
    );
  return response.json() as Promise<T>;
}

function issueLabels(issue: GitHubIssue): string[] {
  return issue.labels
    .map((label) => (typeof label === "string" ? label : (label.name ?? "")))
    .filter(Boolean);
}
function issueStatus(issue: GitHubIssue): string | null {
  for (const label of issueLabels(issue)) {
    const status = statusByLabel.get(label);
    if (status) return status;
  }
  return null;
}

export async function checkGitHubConnection() {
  const config = getGitHubConfig();
  if (!config.configured) return { ...config, connected: false };
  try {
    await githubRequest<{ full_name: string }>("");
    return { ...config, connected: true };
  } catch {
    return { ...config, connected: false };
  }
}

function issueBody(submission: SyncableSubmission) {
  return [
    `<!-- huhy-record:${submission.id} -->`,
    `## Approved public problem brief`,
    submission.problem,
    `## Who experiences it`,
    submission.people,
    `## What happens today`,
    submission.currentToday,
    `## Better outcome`,
    submission.better,
    `## Frequency`,
    submission.frequency,
    submission.existingTool
      ? `## Existing public tool or process\n${submission.existingTool}`
      : "",
    `## Project readiness`,
    `- Public source status: ${submission.sourceStatus}`,
    `- Initial risk: ${submission.risk}`,
    `- Maintainer: ${submission.maintainer}`,
    `- Maintenance status: ${submission.maintenanceStatus}`,
    `- Review cadence: ${submission.reviewCadence}`,
    `- Contributors needed: ${submission.contributorNeeds}`,
    `## Information boundary`,
    `This issue was published from the private HUHY safety queue after steward review. It must contain only publicly released, non-sensitive information.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function createGitHubIssue(submission: SyncableSubmission) {
  const title = `[${submission.id}] ${submission.problem}`.slice(0, 180);
  const body = issueBody(submission);
  return githubRequest<GitHubIssue>("/issues", {
    method: "POST",
    body: JSON.stringify({
      title,
      body,
      labels: [GITHUB_STATUS_LABELS[submission.status]],
    }),
  });
}

export async function updateGitHubIssue(
  issueNumber: number,
  submission: SyncableSubmission,
) {
  const current = await githubRequest<GitHubIssue>(`/issues/${issueNumber}`);
  const preserved = issueLabels(current).filter(
    (label) => !label.startsWith("huhy:"),
  );
  return githubRequest<GitHubIssue>(`/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({
      body: issueBody(submission),
      labels: [...preserved, GITHUB_STATUS_LABELS[submission.status]],
    }),
  });
}

export async function syncSubmissionsFromGitHub(
  db: D1Database,
  submissions: SyncableSubmission[],
): Promise<SyncableSubmission[]> {
  if (!getGitHubConfig().configured) return submissions;
  await db
    .prepare(
      `INSERT INTO users (id,email,display_name,role) VALUES ('github-sync','github-sync@system.invalid','GitHub sync','member') ON CONFLICT(id) DO NOTHING`,
    )
    .run();
  const output: SyncableSubmission[] = [];
  for (const submission of submissions) {
    if (!submission.githubIssueNumber) {
      output.push(submission);
      continue;
    }
    const checkedAt = submission.githubCheckedAt
      ? Date.parse(submission.githubCheckedAt.replace(" ", "T") + "Z")
      : 0;
    if (checkedAt && Date.now() - checkedAt < 5 * 60_000) {
      output.push(submission);
      continue;
    }
    try {
      const issue = await githubRequest<GitHubIssue>(
        `/issues/${submission.githubIssueNumber}`,
      );
      const status = issueStatus(issue) ?? submission.status;
      if (status !== submission.status) {
        await db.batch([
          db
            .prepare(
              `UPDATE submissions SET status=?,github_updated_at=?,github_checked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            )
            .bind(status, issue.updated_at, submission.id),
          db
            .prepare(
              `INSERT INTO disposition_events (submission_id,from_status,to_status,actor_user_id,reason) VALUES (?,?,?,'github-sync','Synced from the GitHub status label')`,
            )
            .bind(submission.id, submission.status, status),
          db
            .prepare(
              `INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,detail) VALUES ('github-sync','submission.github.synced','submission',?,'Status synchronized from GitHub')`,
            )
            .bind(submission.id),
        ]);
      } else
        await db
          .prepare(
            `UPDATE submissions SET github_updated_at=?,github_checked_at=CURRENT_TIMESTAMP WHERE id=?`,
          )
          .bind(issue.updated_at, submission.id)
          .run();
      output.push({
        ...submission,
        status,
        githubUrl: issue.html_url,
        githubUpdatedAt: issue.updated_at,
        githubCheckedAt: new Date().toISOString(),
      });
    } catch {
      await db
        .prepare(
          `UPDATE submissions SET github_checked_at=CURRENT_TIMESTAMP WHERE id=?`,
        )
        .bind(submission.id)
        .run();
      output.push(submission);
    }
  }
  return output;
}
