import test from "node:test";
import assert from "node:assert/strict";
import { toggleHelpfulVote } from "./helpfulVote.js";

function setup({ voted = false, count, approved = true, missing = false } = {}) {
  const writes = [];
  const refs = { syllabusRef: "syllabus", voteRef: "vote", statsRef: "stats", createdAt: "server-time" };
  const snapshot = (exists, data) => ({ exists: () => exists, data: () => data });
  const transaction = {
    get: async (ref) => {
      assert.equal(writes.length, 0, "All reads must precede writes");
      if (ref === "syllabus") return snapshot(!missing, { approved });
      if (ref === "vote") return snapshot(voted, {});
      return snapshot(count !== undefined, { count });
    },
    set: (ref, data) => writes.push(["set", ref, data]),
    delete: (ref) => writes.push(["delete", ref]),
  };
  return { transaction, refs, writes };
}

test("first helpful vote creates one vote and initializes the public count", async () => {
  const { transaction, refs, writes } = setup();
  assert.deepEqual(await toggleHelpfulVote(transaction, refs), { helpful: true, count: 1 });
  assert.deepEqual(writes, [["set", "vote", { createdAt: "server-time" }], ["set", "stats", { count: 1 }]]);
});

test("undo deletes only the user's vote and decrements the count", async () => {
  const { transaction, refs, writes } = setup({ voted: true, count: 3 });
  assert.deepEqual(await toggleHelpfulVote(transaction, refs), { helpful: false, count: 2 });
  assert.deepEqual(writes, [["delete", "vote"], ["set", "stats", { count: 2 }]]);
});

test("transaction retry uses stored vote state rather than stale UI state", async () => {
  const state = setup({ voted: true, count: 1 });
  assert.deepEqual(await toggleHelpfulVote(state.transaction, state.refs), { helpful: false, count: 0 });
});

test("missing and unpublished syllabi cannot receive votes", async () => {
  for (const options of [{ missing: true }, { approved: false }]) {
    const state = setup(options);
    await assert.rejects(toggleHelpfulVote(state.transaction, state.refs), /published/);
    assert.deepEqual(state.writes, []);
  }
});

test("invalid counters never produce negative or corrupted writes", async () => {
  for (const count of [-1, 1.5, "3", NaN, 0]) {
    const state = setup({ count, voted: true });
    await assert.rejects(toggleHelpfulVote(state.transaction, state.refs), /unavailable/);
    assert.deepEqual(state.writes, []);
  }
});

test("read failures leave both votes and count unchanged", async () => {
  const state = setup();
  state.transaction.get = async () => { throw new Error("offline"); };
  await assert.rejects(toggleHelpfulVote(state.transaction, state.refs), /offline/);
  assert.deepEqual(state.writes, []);
});
