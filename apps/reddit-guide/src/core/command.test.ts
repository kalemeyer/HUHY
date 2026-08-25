import assert from "node:assert/strict";
import test from "node:test";

import { parseHuhyCommand } from "./command.ts";

test("recognizes the explicit command and supported intents", () => {
  assert.equal(parseHuhyCommand("!huhy"), "clarify");
  assert.equal(parseHuhyCommand("Please !HUHY research this"), "research");
  assert.equal(parseHuhyCommand("!huhy not-now"), "not-now");
});

test("does not react to partial words or unrelated discussion", () => {
  assert.equal(parseHuhyCommand("huhy"), undefined);
  assert.equal(parseHuhyCommand("email!huhy@example.com"), undefined);
  assert.equal(parseHuhyCommand("!huhyproject"), undefined);
});

test("falls back to clarification for an unsupported intent", () => {
  assert.equal(parseHuhyCommand("!huhy launch"), "clarify");
});
