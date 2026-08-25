import { context } from "@devvit/web/server";
import type { MenuItemRequest, UiResponse } from "@devvit/web/shared";
import { Hono } from "hono";

import { getGuidance, getLatestDraft } from "../storage";

export const menu = new Hono();

menu.post("/guidance", async (c) => {
  await c.req.json<MenuItemRequest>();
  const guidance = await getGuidance();
  return c.json<UiResponse>({
    showForm: {
      name: "guidanceForm",
      form: {
        title: "HUHY standing guidance",
        description:
          "Moderator-only. Public information only. Internal direction is stored for drafting but is never inserted into a public reply.",
        acceptLabel: "Save guidance",
        cancelLabel: "Cancel",
        fields: [
          {
            type: "paragraph",
            name: "opening",
            label: "Public opening",
            helpText: "Exact copy used at the start of each draft.",
            required: true,
          },
          {
            type: "paragraph",
            name: "internalDirection",
            label: "Internal standing direction",
            helpText:
              "Reviewer guidance only. Never included in a public reply.",
            required: true,
          },
          {
            type: "paragraph",
            name: "closing",
            label: "Public call to action",
            helpText: "Exact copy used near the end of each draft.",
            required: true,
          },
          {
            type: "string",
            name: "destinationUrl",
            label: "Public HTTPS destination",
            helpText: "No .mil or private/internal destination.",
            required: true,
          },
          {
            type: "select",
            name: "tone",
            label: "Default tone",
            options: [
              { label: "Plain and direct", value: "plain" },
              { label: "Warm", value: "warm" },
              { label: "Brief", value: "brief" },
            ],
            required: true,
          },
          {
            type: "boolean",
            name: "autoReplyEnabled",
            label: "Enable automatic replies when someone types !huhy",
          },
        ],
      },
      data: { ...guidance, tone: [guidance.tone] },
    },
  });
});

menu.post("/draft", async (c) => {
  await c.req.json<MenuItemRequest>();
  if (!context.postId && !context.commentId) {
    return c.json<UiResponse>({
      showToast: "Run this action from a Reddit post or comment.",
    });
  }
  return c.json<UiResponse>({
    showForm: {
      name: "draftForm",
      form: {
        title: "Draft a HUHY reply",
        description:
          "This prepares a private draft for review. It does not post, comment, message, or transmit data outside this Reddit app.",
        acceptLabel: "Create private draft",
        cancelLabel: "Cancel",
        fields: [
          {
            type: "select",
            name: "intent",
            label: "Disposition for this reply",
            options: [
              { label: "Ask for clarification", value: "clarify" },
              { label: "Research first", value: "research" },
              { label: "Invite to HUHY", value: "invite" },
              { label: "Refer to an existing owner", value: "refer" },
              { label: "Not now, with reopening condition", value: "not-now" },
            ],
            required: true,
          },
          {
            type: "paragraph",
            name: "publicFacts",
            label: "Public facts to include (optional)",
            helpText:
              "Do not paste the Reddit post. Add only facts already safe for public release.",
          },
          {
            type: "paragraph",
            name: "threadDirection",
            label: "Private direction for the reviewer (optional)",
            helpText: "Stored with the draft, never inserted into the reply.",
          },
          {
            type: "boolean",
            name: "confirmedPublicOnly",
            label:
              "I confirm this contains no PII, PHI, CUI, credentials, internal screenshots, or operational/readiness data.",
          },
        ],
      },
      data: { intent: ["clarify"], confirmedPublicOnly: false },
    },
  });
});

menu.post("/latest-draft", async (c) => {
  await c.req.json<MenuItemRequest>();
  const draft = await getLatestDraft();
  if (!draft) {
    return c.json<UiResponse>({
      showToast: "No HUHY draft has been saved yet.",
    });
  }
  return c.json<UiResponse>({
    showForm: reviewForm(draft.id, draft.text, draft.internalDirection),
  });
});

menu.post("/clear-data", async (c) => {
  await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>({
    showForm: {
      name: "clearDataForm",
      form: {
        title: "Clear HUHY stored data",
        description:
          "This permanently deletes the saved guidance and latest draft for this subreddit installation.",
        acceptLabel: "Delete stored data",
        cancelLabel: "Cancel",
        fields: [
          {
            type: "boolean",
            name: "confirmed",
            label: "I understand this data cannot be recovered.",
          },
        ],
      },
      data: { confirmed: false },
    },
  });
});

export function reviewForm(
  id: string,
  text: string,
  internalDirection: string,
): NonNullable<UiResponse["showForm"]> {
  return {
    name: "reviewForm",
    form: {
      title: `Review HUHY draft ${id}`,
      description:
        "Edit as needed. Saving marks the draft reviewed; this app still will not post it.",
      acceptLabel: "Mark reviewed",
      cancelLabel: "Close",
      fields: [
        {
          type: "paragraph",
          name: "text",
          label: "Draft reply",
          required: true,
        },
        {
          type: "paragraph",
          name: "internalDirection",
          label: "Internal reviewer direction",
          disabled: true,
        },
      ],
    },
    data: { text, internalDirection },
  };
}
