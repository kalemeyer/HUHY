import { context } from "@devvit/web/server";
import type { UiResponse } from "@devvit/web/shared";
import { Hono } from "hono";

import {
  buildDraft,
  buildInternalDirection,
  removeStandardBoundary,
} from "../../core/draft";
import { normalizeGuidance } from "../../core/guidance";
import { findSafetyFlags } from "../../core/safety";
import {
  intentValues,
  toneValues,
  type DraftInput,
  type SavedDraft,
} from "../../core/types";
import {
  clearStoredData,
  getGuidance,
  getLatestDraft,
  saveGuidance,
  saveLatestDraft,
} from "../storage";
import { reviewForm } from "./menu";

type GuidanceFormValues = {
  opening?: string;
  internalDirection?: string;
  closing?: string;
  destinationUrl?: string;
  tone?: string[];
  autoReplyEnabled?: boolean;
};

type DraftFormValues = {
  intent?: string[];
  publicFacts?: string;
  threadDirection?: string;
  confirmedPublicOnly?: boolean;
};

type ReviewFormValues = { text?: string };
type ClearDataFormValues = { confirmed?: boolean };
export const forms = new Hono();

forms.post("/guidance", async (c) => {
  const values = await c.req.json<GuidanceFormValues>();
  const tone = firstAllowed(values.tone, toneValues, "plain");
  const guidance = normalizeGuidance({
    ...values,
    tone,
    autoReplyEnabled: values.autoReplyEnabled === true,
  });
  const flags = findSafetyFlags(
    guidance.opening,
    guidance.internalDirection,
    guidance.closing,
  );
  if (flags.length > 0) {
    return c.json<UiResponse>({
      showToast: `Guidance not saved: remove possible ${flagLabels(flags)}.`,
    });
  }
  const enteredUrl = values.destinationUrl?.trim().replace(/\/$/, "") ?? "";
  if (!enteredUrl || guidance.destinationUrl !== enteredUrl) {
    return c.json<UiResponse>({
      showToast:
        "Guidance not saved: enter a valid public HTTPS URL (not .mil).",
    });
  }
  await saveGuidance(guidance);
  return c.json<UiResponse>({
    showToast: guidance.autoReplyEnabled
      ? "HUHY guidance saved. !huhy replies are enabled."
      : "HUHY guidance saved. !huhy replies are paused.",
  });
});

forms.post("/draft", async (c) => {
  const values = await c.req.json<DraftFormValues>();
  const intent = firstAllowed(values.intent, intentValues, "clarify");
  const input: DraftInput = {
    intent,
    publicFacts: values.publicFacts?.trim() ?? "",
    threadDirection: values.threadDirection?.trim() ?? "",
    confirmedPublicOnly: values.confirmedPublicOnly === true,
  };
  if (!input.confirmedPublicOnly) {
    return c.json<UiResponse>({
      showToast:
        "Draft not created: confirm the public-information-only boundary.",
    });
  }
  const flags = findSafetyFlags(input.publicFacts, input.threadDirection);
  if (flags.length > 0) {
    return c.json<UiResponse>({
      showToast: `Draft not created: remove possible ${flagLabels(flags)}.`,
    });
  }
  const sourceId = context.commentId ?? context.postId;
  if (!sourceId) {
    return c.json<UiResponse>({
      showToast: "Draft not created: no source post or comment was available.",
    });
  }
  const guidance = await getGuidance();
  const now = new Date();
  const draft: SavedDraft = {
    id: now
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14),
    createdAt: now.toISOString(),
    sourceId,
    intent,
    internalDirection: buildInternalDirection(guidance, input),
    text: buildDraft(guidance, input),
    status: "pending-review",
  };
  await saveLatestDraft(draft);
  return c.json<UiResponse>({
    showForm: reviewForm(draft.id, draft.text, draft.internalDirection),
  });
});

forms.post("/review", async (c) => {
  const values = await c.req.json<ReviewFormValues>();
  const latest = await getLatestDraft();
  const text = values.text?.trim() ?? "";
  if (!latest || !text) {
    return c.json<UiResponse>({
      showToast: "Review not saved: the draft is missing or empty.",
    });
  }
  const flags = findSafetyFlags(removeStandardBoundary(text));
  if (flags.length > 0) {
    return c.json<UiResponse>({
      showToast: `Review not saved: remove possible ${flagLabels(flags)}.`,
    });
  }
  await saveLatestDraft({ ...latest, text, status: "reviewed" });
  return c.json<UiResponse>({
    showToast: "Draft marked reviewed. It was not posted to Reddit.",
  });
});

forms.post("/clear-data", async (c) => {
  const values = await c.req.json<ClearDataFormValues>();
  if (values.confirmed !== true) {
    return c.json<UiResponse>({
      showToast: "Stored data was not deleted.",
    });
  }

  await clearStoredData();
  return c.json<UiResponse>({
    showToast: "HUHY guidance and latest draft deleted.",
  });
});

function firstAllowed<T extends string>(
  value: string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const first = value?.[0];
  return first && allowed.some((candidate) => candidate === first)
    ? (first as T)
    : fallback;
}

function flagLabels(flags: ReturnType<typeof findSafetyFlags>): string {
  return flags.map((flag) => flag.label).join(", ");
}
