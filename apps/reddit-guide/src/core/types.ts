export const intentValues = [
  "clarify",
  "research",
  "invite",
  "refer",
  "not-now",
] as const;

export type DraftIntent = (typeof intentValues)[number];

export const toneValues = ["plain", "warm", "brief"] as const;
export type DraftTone = (typeof toneValues)[number];

export type Guidance = {
  opening: string;
  internalDirection: string;
  closing: string;
  destinationUrl: string;
  tone: DraftTone;
  autoReplyEnabled: boolean;
};

export type DraftInput = {
  intent: DraftIntent;
  publicFacts: string;
  threadDirection: string;
  confirmedPublicOnly: boolean;
};

export type SavedDraft = {
  id: string;
  createdAt: string;
  sourceId: string;
  intent: DraftIntent;
  internalDirection: string;
  text: string;
  status: "pending-review" | "reviewed";
};
