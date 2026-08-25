import type { DraftIntent } from "./types.ts";

const commandPattern =
  /(?:^|\s)!huhy(?:\s+(clarify|research|invite|refer|not-now))?(?=\s|$)/i;

export function parseHuhyCommand(value: string): DraftIntent | undefined {
  const match = commandPattern.exec(value);
  if (!match) return undefined;

  const intent = match[1]?.toLowerCase();
  return intent === "research" ||
    intent === "invite" ||
    intent === "refer" ||
    intent === "not-now"
    ? intent
    : "clarify";
}
