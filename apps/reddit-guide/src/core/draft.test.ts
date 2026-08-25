import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDraft,
  buildInternalDirection,
  removeStandardBoundary,
} from "./draft.ts";
import {
  defaultGuidance,
  normalizeGuidance,
  normalizePublicUrl,
} from "./guidance.ts";
import { findSafetyFlags } from "./safety.ts";

test("buildDraft always includes the unofficial and public-only boundary", () => {
  const draft = buildDraft(defaultGuidance, {
    intent: "invite",
    publicFacts: "A public checklist could reduce duplicate work.",
    threadDirection: "",
    confirmedPublicOnly: true,
  });
  assert.match(draft, /independent and unofficial/i);
  assert.match(draft, /publicly released, unclassified information only/i);
  assert.match(draft, /https:\/\/huhyproject\.org/);
});

test("brief tone produces a compact draft", () => {
  const draft = buildDraft(
    { ...defaultGuidance, tone: "brief" },
    {
      intent: "clarify",
      publicFacts: "",
      threadDirection: "",
      confirmedPublicOnly: true,
    },
  );
  assert.equal(draft.includes("\n"), false);
});

test("internal direction never becomes public draft copy", () => {
  const input = {
    intent: "research" as const,
    publicFacts: "",
    threadDirection: "Ask the steward before using a link.",
    confirmedPublicOnly: true,
  };
  assert.doesNotMatch(buildDraft(defaultGuidance, input), /Ask the steward/);
  assert.match(
    buildInternalDirection(defaultGuidance, input),
    /Ask the steward/,
  );
});

test("safety screen detects common restricted material", () => {
  const flags = findSafetyFlags(
    "Email me at person@example.com with the CUI screenshot and API key.",
  );
  const codes = flags.map((flag) => flag.code);
  assert.ok(codes.includes("classification"));
  assert.ok(codes.includes("credential"));
  assert.ok(codes.includes("email"));
});

test("standard safety notice can be excluded from review screening", () => {
  const draft = buildDraft(defaultGuidance, {
    intent: "clarify",
    publicFacts: "",
    threadDirection: "",
    confirmedPublicOnly: true,
  });

  assert.deepEqual(findSafetyFlags(removeStandardBoundary(draft)), []);
});

test("normalization rejects non-HTTPS and military-only destinations", () => {
  assert.equal(normalizePublicUrl("http://example.com"), "");
  assert.equal(normalizePublicUrl("https://portal.example.mil"), "");
  assert.equal(
    normalizePublicUrl("https://huhyproject.org/"),
    "https://huhyproject.org",
  );
  const guidance = normalizeGuidance({ opening: "  Hello   there  " });
  assert.equal(guidance.opening, "Hello there");
});
