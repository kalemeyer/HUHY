import assert from "node:assert/strict";
import test from "node:test";

import { defaultGuidance, normalizeGuidance } from "./guidance.ts";

test("automatic replies fail closed until a moderator enables them", () => {
  assert.equal(defaultGuidance.autoReplyEnabled, false);
  assert.equal(normalizeGuidance(undefined).autoReplyEnabled, false);
  assert.equal(normalizeGuidance({}).autoReplyEnabled, false);
});

test("an explicit saved enablement survives normalization", () => {
  assert.equal(
    normalizeGuidance({ autoReplyEnabled: true }).autoReplyEnabled,
    true,
  );
});
