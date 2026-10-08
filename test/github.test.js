import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifySignature, announcementsFromPush } from "../lib/github.js";

const SECRET = "test-secret";
const sign = (body) => "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");

test("accepts a valid signature", () => {
  const body = Buffer.from('{"ok":true}');
  assert.equal(verifySignature(SECRET, body, sign(body)), true);
});

test("rejects a signature made with a different secret", () => {
  const body = Buffer.from('{"ok":true}');
  const wrong = "sha256=" + createHmac("sha256", "other").update(body).digest("hex");
  assert.equal(verifySignature(SECRET, body, wrong), false);
});

test("rejects a tampered body", () => {
  const body = Buffer.from('{"ok":true}');
  assert.equal(verifySignature(SECRET, Buffer.from('{"ok":false}'), sign(body)), false);
});

test("rejects a missing header or missing secret", () => {
  const body = Buffer.from("{}");
  assert.equal(verifySignature(SECRET, body, undefined), false);
  assert.equal(verifySignature("", body, sign(body)), false);
});

test("rejects a header of the wrong length without throwing", () => {
  assert.equal(verifySignature(SECRET, Buffer.from("{}"), "sha256=abc"), false);
});

const payload = (overrides = {}) => ({
  ref: "refs/heads/main",
  repository: { full_name: "stevenalfaro-bit/minions-project", default_branch: "main" },
  commits: [
    {
      id: "abc123",
      message: "Fix header\n\nLonger body",
      author: { username: "steven" },
      added: ["new.js"],
      modified: ["index.html"],
      removed: [],
    },
  ],
  ...overrides,
});

test("maps each commit to one announcement with the first message line", () => {
  const rows = announcementsFromPush(payload());
  assert.deepEqual(rows, [
    {
      repo: "stevenalfaro-bit/minions-project",
      sha: "abc123",
      author: "steven",
      message: "Fix header",
      changes: { added: ["new.js"], modified: ["index.html"], removed: [] },
    },
  ]);
});

test("ignores pushes to non-default branches", () => {
  assert.equal(announcementsFromPush(payload({ ref: "refs/heads/feature" })), null);
});

test("falls back to author name and empty lists when fields are missing", () => {
  const rows = announcementsFromPush({
    ref: "refs/heads/main",
    repository: { full_name: "a/b", default_branch: "main" },
    commits: [{ id: "x", message: "m", author: { name: "Sam" } }],
  });
  assert.equal(rows[0].author, "Sam");
  assert.deepEqual(rows[0].changes, { added: [], modified: [], removed: [] });
});

test("returns no rows for a push with no commits", () => {
  assert.deepEqual(announcementsFromPush(payload({ commits: [] })), []);
});

