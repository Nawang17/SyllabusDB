import test from "node:test";
import assert from "node:assert/strict";
import { validateSyllabusEdit, applyPendingSyllabusEdit, cleanupEmptySourceCourse } from "./adminSyllabusEdit.js";

const draft = { courseCode: "cs-gy9215", courseTitle: "  Algorithms  ", year: "2026", term: "Fall" };

test("admin edits normalize codes and validate required information", () => {
  assert.deepEqual(validateSyllabusEdit(draft), { courseCode: "CS-GY 9215", courseTitle: "Algorithms", year: 2026, term: "Fall" });
  for (const invalid of [{ courseCode: "" }, { courseCode: "CS/101" }, { courseCode: ".." }, { courseTitle: " " }, { year: "abc" }, { year: "26" }, { term: "Other" }]) {
    assert.throws(() => validateSyllabusEdit({ ...draft, ...invalid }));
  }
});

function fixture({ moving = true, approved = false, collision = false, exists = true, courseExists = false } = {}) {
  const refs = { source: { path: "old/syllabi/1" }, destination: { path: moving ? "new/syllabi/1" : "old/syllabi/1" }, course: { path: "new" } };
  const original = { approved, owner: "student", pdf_url: "original.pdf", file_path: "original/path.pdf", rating: 4, experience_text: "Review", createdAt: "timestamp", year: 2025, term: "Spring" };
  const writes = [];
  const transaction = {
    async get(ref) {
      assert.equal(writes.length, 0, "reads must precede writes");
      if (ref === refs.source) return { exists: () => exists, data: () => original };
      if (ref === refs.course) return { exists: () => courseExists };
      return { exists: () => collision };
    },
    set(...args) { writes.push(["set", ...args]); },
    update(...args) { writes.push(["update", ...args]); },
    delete(...args) { writes.push(["delete", ...args]); },
  };
  return { refs, transaction, original, writes };
}

test("moving a pending upload preserves metadata and creates an unapproved course", async () => {
  const f = fixture();
  await applyPendingSyllabusEdit(f.transaction, f.refs, validateSyllabusEdit(draft));
  assert.deepEqual(f.writes, [
    ["set", f.refs.course, { code: "CS-GY 9215", title: "Algorithms", approved: false }, { merge: true }],
    ["set", f.refs.destination, { ...f.original, year: 2026, term: "Fall" }],
    ["delete", f.refs.source],
  ]);
});

test("in-place edits retain course approval and counters and do not delete the upload", async () => {
  const f = fixture({ moving: false, courseExists: true });
  await applyPendingSyllabusEdit(f.transaction, f.refs, validateSyllabusEdit(draft));
  assert.deepEqual(f.writes, [
    ["set", f.refs.course, { code: "CS-GY 9215", title: "Algorithms" }, { merge: true }],
    ["update", f.refs.source, { year: 2026, term: "Fall" }],
  ]);
});

test("missing, approved and colliding uploads fail before any writes", async () => {
  for (const options of [{ exists: false }, { approved: true }, { collision: true }]) {
    const f = fixture(options);
    await assert.rejects(applyPendingSyllabusEdit(f.transaction, f.refs, validateSyllabusEdit(draft)));
    assert.equal(f.writes.length, 0);
  }
});

function cleanupFixture(sameCourse = false) {
  const sourceCourse = { path: "courses/old" };
  const destinationCourse = sameCourse ? sourceCourse : { path: "courses/new" };
  return {
    source: { parent: { parent: sourceCourse } },
    destination: { parent: { parent: destinationCourse } },
    sourceCourse,
  };
}

test("cleanup deletes only an empty source course after a move", async () => {
  const f = cleanupFixture();
  const deleted = [];
  const result = await cleanupEmptySourceCourse(f.source, f.destination, {
    hasSyllabi: async (course) => { assert.equal(course, f.sourceCourse); return false; },
    deleteCourse: async (course) => deleted.push(course),
  });
  assert.equal(result, true);
  assert.deepEqual(deleted, [f.sourceCourse]);
});

test("cleanup keeps a course with any remaining syllabi", async () => {
  const f = cleanupFixture();
  assert.equal(await cleanupEmptySourceCourse(f.source, f.destination, {
    hasSyllabi: async () => true,
    deleteCourse: async () => assert.fail("Must preserve a nonempty course"),
  }), false);
});

test("in-place edits skip cleanup and a failed check never deletes the course", async () => {
  const same = cleanupFixture(true);
  assert.equal(await cleanupEmptySourceCourse(same.source, same.destination, {
    hasSyllabi: async () => assert.fail("In-place edit must not query siblings"),
    deleteCourse: async () => assert.fail("In-place edit must not delete the course"),
  }), false);
  const moved = cleanupFixture();
  await assert.rejects(cleanupEmptySourceCourse(moved.source, moved.destination, {
    hasSyllabi: async () => { throw new Error("Server unavailable"); },
    deleteCourse: async () => assert.fail("Failed check must not delete the course"),
  }), /Server unavailable/);
});
