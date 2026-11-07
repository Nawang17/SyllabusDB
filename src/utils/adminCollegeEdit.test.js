import test from "node:test";
import assert from "node:assert/strict";
import { generateCollegeId, validateCollegeEdit, applyPendingCollegeEdit } from "./adminCollegeEdit.js";

test("college editing trims details and preserves spelling and punctuation", () => {
  assert.deepEqual(validateCollegeEdit({
    name: "  St. John's University  ", city: "  New York ", state: " NY ", owner: "ignored",
  }), { name: "St. John's University", city: "New York", state: "NY" });
});

test("college editing requires a name, city and state", () => {
  const valid = { name: "Example College", city: "New York", state: "NY" };
  for (const field of ["name", "city", "state"]) {
    assert.throws(() => validateCollegeEdit({ ...valid, [field]: "  " }), /Enter the college name, city, and state/);
  }
  assert.throws(() => validateCollegeEdit({ ...valid, name: "---" }), /document ID/);
});

test("college IDs follow the existing college request naming rule", () => {
  assert.equal(generateCollegeId("  St. John's University  "), "st-john-s-university");
  assert.equal(generateCollegeId("New   York -- University"), "new-york-university");
});

test("college save updates the original document with only name, city and state", async () => {
  const collegeRef = { path: "colleges/original-id" };
  const original = { approved: false, owner: "student", createdAt: "timestamp", approvedSyllabiTotal: 5 };
  const writes = [];
  await applyPendingCollegeEdit({
    async get(ref) {
      assert.equal(ref, collegeRef);
      return { exists: () => true, data: () => original };
    },
    update(...args) { writes.push(args); },
  }, collegeRef, { name: "Corrected College", city: "Albany", state: "NY", owner: "must-not-write", approved: true });
  assert.deepEqual(writes, [[collegeRef, { name: "Corrected College", city: "Albany", state: "NY" }]]);
});

test("college save refuses deleted or already approved requests without writes", async () => {
  for (const exists of [true, false]) {
    await assert.rejects(applyPendingCollegeEdit({
      async get() { return { exists: () => exists, data: () => ({ approved: true }) }; },
      update() { assert.fail("A stale request must not be changed"); },
    }, { path: "colleges/example" }, { name: "Example", city: "New York", state: "NY" }));
  }
});

function renameFixture() {
  const source = { path: "colleges/old-name" };
  const destination = { path: "colleges/new-name" };
  const documents = [
    { source: { path: `${source.path}/courses/CS 101` }, destination: { path: `${destination.path}/courses/CS 101` } },
    { source: { path: `${source.path}/courses/CS 101/syllabi/one` }, destination: { path: `${destination.path}/courses/CS 101/syllabi/one` } },
    { source: { path: `${source.path}/courses/CS 101/syllabi/two` }, destination: { path: `${destination.path}/courses/CS 101/syllabi/two` } },
  ];
  const records = new Map([
    [source.path, { name: "Old Name", approved: false, owner: "requester", createdAt: "timestamp", approvedSyllabiTotal: 1, image_url: "image" }],
    [documents[0].source.path, { code: "CS 101", title: "Intro", approved: true, approvedSyllabiCount: 1 }],
    [documents[1].source.path, { owner: "student-a", approved: true, year: 2025, term: "Fall", pdf_url: "a.pdf", file_path: "old/storage/a.pdf" }],
    [documents[2].source.path, { owner: "student-b", approved: false, rating: 4, experience_text: "Review", createdAt: "upload time", pdf_url: "b.pdf" }],
  ]);
  const writes = [];
  const transaction = {
    async get(ref) {
      assert.equal(writes.length, 0, "All records must be read before writing");
      return { exists: () => records.has(ref.path), data: () => records.get(ref.path) };
    },
    set(...args) { writes.push(["set", ...args]); },
    delete(...args) { writes.push(["delete", ...args]); },
    update() { assert.fail("A rename should move documents"); },
  };
  return { source, destination, documents, records, writes, transaction };
}

const renamedDetails = { name: "New Name", city: "Albany", state: "NY" };

test("college rename moves all supplied courses and syllabi with owners and metadata intact", async () => {
  const f = renameFixture();
  await applyPendingCollegeEdit(f.transaction, f.source, renamedDetails, f);
  assert.deepEqual(f.writes, [
    ["set", f.destination, { ...f.records.get(f.source.path), ...renamedDetails }],
    ...f.documents.flatMap((child) => [
      ["set", child.destination, f.records.get(child.source.path)],
      ["delete", child.source],
    ]),
    ["delete", f.source],
  ]);
});

test("college rename refuses destination colleges and child collisions before writing", async () => {
  for (const collision of ["college", "child"]) {
    const f = renameFixture();
    f.records.set(collision === "college" ? f.destination.path : f.documents[1].destination.path, { owner: "another user" });
    await assert.rejects(applyPendingCollegeEdit(f.transaction, f.source, renamedDetails, f), /already/);
    assert.equal(f.writes.length, 0);
  }
});

test("college rename refuses changed records and oversized moves without partial writes", async () => {
  const f = renameFixture();
  f.records.delete(f.documents[0].source.path);
  await assert.rejects(applyPendingCollegeEdit(f.transaction, f.source, renamedDetails, f), /changed/);
  assert.equal(f.writes.length, 0);
  await assert.rejects(applyPendingCollegeEdit(f.transaction, f.source, renamedDetails, {
    destination: f.destination, documents: Array(201).fill(f.documents[0]),
  }), /too many records/);
  assert.equal(f.writes.length, 0);
});

test("college rename also handles requests with no courses", async () => {
  const f = renameFixture();
  await applyPendingCollegeEdit(f.transaction, f.source, renamedDetails, { destination: f.destination });
  assert.deepEqual(f.writes, [
    ["set", f.destination, { ...f.records.get(f.source.path), ...renamedDetails }],
    ["delete", f.source],
  ]);
});
