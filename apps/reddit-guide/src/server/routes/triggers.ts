import { reddit, redis } from "@devvit/web/server";
import type {
  OnCommentSubmitRequest,
  OnPostSubmitRequest,
  TriggerResponse,
} from "@devvit/web/shared";
import { Hono } from "hono";

import { parseHuhyCommand } from "../../core/command";
import { buildDraft } from "../../core/draft";
import type { DraftIntent } from "../../core/types";
import { getGuidance } from "../storage";

const appUsername = "huhy-guide";
const replyWindowMs = 30 * 24 * 60 * 60 * 1000;
const authorCooldownMs = 60 * 1000;
const failureBackoffMs = 5 * 60 * 1000;

export const triggers = new Hono();

triggers.post("/post-submit", async (c) => {
  const event = await c.req.json<OnPostSubmitRequest>();
  const post = event.post;
  const intent = post
    ? parseHuhyCommand(`${post.title}\n${post.selftext}`)
    : undefined;
  if (post && intent && isCommentableId(post.id)) {
    await replyToInvocation(post.id, event.author?.name, intent);
  }
  return c.json<TriggerResponse>({});
});

triggers.post("/comment-submit", async (c) => {
  const event = await c.req.json<OnCommentSubmitRequest>();
  const comment = event.comment;
  const intent = comment ? parseHuhyCommand(comment.body) : undefined;
  if (comment && intent && isCommentableId(comment.id)) {
    await replyToInvocation(comment.id, event.author?.name, intent);
  }
  return c.json<TriggerResponse>({});
});

async function replyToInvocation(
  sourceId: `t1_${string}` | `t3_${string}`,
  authorName: string | undefined,
  intent: DraftIntent,
): Promise<void> {
  if (!authorName || authorName.toLowerCase() === appUsername) return;

  const guidance = await getGuidance();
  if (!guidance.autoReplyEnabled) return;

  const sourceKey = `huhy:reply:source:${sourceId}`;
  const authorKey = `huhy:reply:author:${authorName.toLowerCase()}`;
  const claim = crypto.randomUUID();
  const pendingClaim = `pending:${claim}`;
  await redis.set(sourceKey, pendingClaim, {
    nx: true,
    expiration: new Date(Date.now() + replyWindowMs),
  });
  if ((await redis.get(sourceKey)) !== pendingClaim) return;

  await redis.set(authorKey, claim, {
    nx: true,
    expiration: new Date(Date.now() + authorCooldownMs),
  });
  if ((await redis.get(authorKey)) !== claim) {
    if ((await redis.get(sourceKey)) === pendingClaim)
      await redis.del(sourceKey);
    return;
  }

  try {
    const text = buildDraft(guidance, {
      intent,
      publicFacts: "",
      threadDirection: "",
      confirmedPublicOnly: true,
    });
    await reddit.submitComment({ id: sourceId, text });
    await redis.set(sourceKey, "replied", {
      expiration: new Date(Date.now() + replyWindowMs),
    });
  } catch (error) {
    await redis.set(sourceKey, "failed-backoff", {
      xx: true,
      expiration: new Date(Date.now() + failureBackoffMs),
    });
    throw error;
  }
}

function isCommentableId(
  value: string,
): value is `t1_${string}` | `t3_${string}` {
  return value.startsWith("t1_") || value.startsWith("t3_");
}
