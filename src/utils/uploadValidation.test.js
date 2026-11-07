import test from "node:test";
import assert from "node:assert/strict";
import { MAX_SYLLABUS_BYTES, syllabusFileError, syllabusDetailsError } from "./uploadValidation.js";

const details = {
  collegeId: "example-college", courseCode: "cs-gy9215", courseTitle: "Algorithms",
  professor: "Jane Smith", term: "Fall", year: 2026,
};

test("upload accepts PDFs up to the existing 5 MB limit", () => {
  assert.equal(syllabusFileError({ type: "application/pdf", size: 100 }), "");
  assert.equal(syllabusFileError({ type: "application/pdf", size: MAX_SYLLABUS_BYTES }), "");
});

test("upload rejects missing, non-PDF, empty and oversized files", () => {
  for (const file of [null, { type: "text/plain", size: 100 }, { type: "application/pdf", size: 0 }, { type: "application/pdf", size: MAX_SYLLABUS_BYTES + 1 }]) {
    assert.notEqual(syllabusFileError(file), "");
  }
});

test("details validation preserves CUNY, NYU and other existing code formats", () => {
  for (const courseCode of ["csci12800", "CSCI 12800", "CS-GY 9215", "cs-gy9215", "MATH 101", "CS 101.5"]) {
    assert.equal(syllabusDetailsError({ ...details, courseCode }), "");
  }
});

test("details validation catches missing fields, unsafe document paths and invalid terms or years", () => {
  for (const change of [
    { collegeId: "" }, { courseCode: " " }, { courseCode: "CS/101" },
    { courseCode: ".." }, { courseTitle: " " }, { professor: " " },
    { term: null }, { term: "Other" }, { year: "" }, { year: "26" },
    { year: "2026.5" }, { year: 999 },
  ]) assert.notEqual(syllabusDetailsError({ ...details, ...change }), "");
  assert.equal(syllabusDetailsError({ ...details, year: "2026", term: "Winter" }), "");
});
