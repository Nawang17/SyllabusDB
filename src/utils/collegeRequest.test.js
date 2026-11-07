import test from "node:test";
import assert from "node:assert/strict";
import { validateCollegeRequest, createCollegeRequest } from "./collegeRequest.js";

test("college requests trim details and preserve names and regional spelling", () => {
  assert.deepEqual(validateCollegeRequest({ name: "  St. John's University ", city: " New York ", state: " NY " }), {
    details: { name: "St. John's University", city: "New York", state: "NY" }, errors: {},
  });
});

test("college requests report individual missing fields and unusable names", () => {
  assert.deepEqual(Object.keys(validateCollegeRequest({ name: " ", city: " ", state: "" }).errors), ["name", "city", "state"]);
  assert.ok(validateCollegeRequest({ name: "---", city: "Boston", state: "MA" }).errors.name);
});

test("new requests preserve the schema and authenticated owner", async () => {
  const ref = { path: "colleges/example" };
  const writes = [];
  const result = await createCollegeRequest({
    async get(target) { assert.equal(target, ref); return { exists: () => false }; },
    set(...args) { writes.push(args); },
  }, ref, { name: "Example", city: "Boston", state: "MA", approved: true, owner: "wrong-owner" }, { owner: "requester", createdAt: "timestamp" });
  assert.deepEqual(result, { created: true });
  assert.deepEqual(writes, [[ref, {
    name: "Example", city: "Boston", state: "MA", approved: false,
    createdAt: "timestamp", approvedSyllabiTotal: 0, image_url: null, owner: "requester",
  }]]);
});

test("duplicate requests leave pending, approved and legacy colleges untouched", async () => {
  for (const approved of [true, false, undefined]) {
    const result = await createCollegeRequest({
      async get() { return { exists: () => true, data: () => ({ approved, owner: "original-owner" }) }; },
      set() { assert.fail("Must not overwrite an existing college"); },
    }, { path: "colleges/example" }, {}, { owner: "new-owner" });
    assert.deepEqual(result, { created: false, approved: approved !== false });
  }
});

test("authentication and read failures prevent request creation", async () => {
  await assert.rejects(createCollegeRequest({
    async get() { return { exists: () => false }; },
    set() { assert.fail("Must not create a request without an owner"); },
  }, {}, {}, { owner: null }), /authenticate/);
  await assert.rejects(createCollegeRequest({
    async get() { throw new Error("Network error"); },
    set() { assert.fail("Failed reads must not write"); },
  }, {}, {}, { owner: "student" }), /Network error/);
});
