export type SafetyFlag = { code: string; label: string };

const checks: ReadonlyArray<{
  code: string;
  label: string;
  pattern: RegExp;
}> = [
  {
    code: "classification",
    label: "classification or controlled-information marking",
    pattern:
      /\b(cui|fouo|secret|top secret|classified|unclassified\s*\/\/|noforn)\b/i,
  },
  {
    code: "government-system",
    label: "government-only system or network reference",
    pattern: /\b(cac|nipr|sipr|\.mil|mil-only)\b/i,
  },
  {
    code: "credential",
    label: "credential or secret",
    pattern:
      /\b(password|passwd|api[-_ ]?key|access[-_ ]?token|client[-_ ]?secret|private[-_ ]?key|bearer\s+[a-z0-9._-]+)\b/i,
  },
  {
    code: "personal-data",
    label: "possible personal or health information",
    pattern: /\b(pii|phi|ssn|social security|medical record|patient)\b/i,
  },
  {
    code: "email",
    label: "email address",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    code: "phone",
    label: "possible phone number",
    pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/,
  },
  {
    code: "readiness",
    label: "operational or readiness information",
    pattern:
      /\b(mission capable|readiness rate|deployment schedule|sortie rate|operational data|troop movement)\b/i,
  },
  {
    code: "internal-media",
    label: "internal screenshot or upload reference",
    pattern:
      /\b(internal screenshot|screenshot from|upload the screenshot|sharepoint screenshot)\b/i,
  },
];

export function findSafetyFlags(...values: unknown[]): SafetyFlag[] {
  const text = values
    .filter((value): value is string => typeof value === "string")
    .join("\n");

  return checks
    .filter((check) => check.pattern.test(text))
    .map(({ code, label }) => ({ code, label }));
}
