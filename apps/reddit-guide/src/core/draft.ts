import type { DraftInput, DraftIntent, Guidance } from "./types.ts";

const intentCopy: Record<DraftIntent, string> = {
  clarify:
    "The problem is worth understanding. What outcome would help, who runs into it, and what can be described using public information only?",
  research:
    "This looks worth researching before anyone commits to a build. We can check for an existing public tool, identify the real user need, and bring the findings back for a visible disposition.",
  invite:
    "This looks like a possible HUHY build. The next step is to describe the public problem clearly, identify an owner, and see whether contributors want to help.",
  refer:
    "There may already be a better home or an existing owner for this work. HUHY can help connect the public problem to that effort without taking over its repository, brand, or project.",
  "not-now":
    "This may not be ready to move now, but it should not disappear. A useful disposition explains what is missing and what would allow the idea to be reconsidered.",
};

export const publicBoundaryNotice =
  "HUHY is independent and unofficial. Publicly released, unclassified information only—no PII, PHI, CUI, credentials, internal screenshots, or operational/readiness data.";

export function buildDraft(guidance: Guidance, input: DraftInput): string {
  const parts = [guidance.opening, intentCopy[input.intent]];
  const facts = cleanParagraph(input.publicFacts);
  if (facts) parts.push(facts);

  const destination = guidance.destinationUrl
    ? `${guidance.closing} ${guidance.destinationUrl}`
    : guidance.closing;
  parts.push(destination);
  parts.push(publicBoundaryNotice);

  const draft = parts.filter(Boolean).join("\n\n");
  return guidance.tone === "brief" ? compact(draft) : draft;
}

export function removeStandardBoundary(value: string): string {
  return value.replace(publicBoundaryNotice, "");
}

export function buildInternalDirection(
  guidance: Guidance,
  input: DraftInput,
): string {
  const threadDirection = cleanParagraph(input.threadDirection);
  return [guidance.internalDirection, threadDirection]
    .filter(Boolean)
    .join(" | ");
}

function cleanParagraph(value: string): string {
  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function compact(value: string): string {
  return value.replace(/\n\n/g, " ");
}
