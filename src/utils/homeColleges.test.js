import test from "node:test";
import assert from "node:assert/strict";
import { publicHomeColleges, searchHomeColleges, topHomeColleges } from "./homeColleges.js";

const colleges = publicHomeColleges([
  { id: "nyu", name: "New York University", approved: true, city: "New York", state: "NY", approvedSyllabiTotal: 50 },
  { id: "cuny", name: "City University of New York", approvedSyllabiTotal: 100, nickname: "CUNY", aliases: ["The City University", "CUNY system"] },
  { id: "hunter", name: "Hunter College", approved: true, approvedSyllabiTotal: 200, nickname: "Hunter", aliases: ["Hunter CUNY"] },
  { id: "pending", name: "Pending College", approved: false, approvedSyllabiTotal: 10000 },
  { id: "unnamed", name: " " },
]);

test("homepage excludes pending and unnamed colleges before rankings and search", () => {
  assert.deepEqual(topHomeColleges(colleges).map((college) => college.id), ["hunter", "cuny", "nyu"]);
  assert.deepEqual(searchHomeColleges(colleges, "pending"), []);
  assert.equal(colleges.find((college) => college.id === "nyu").city, "New York");
});

test("college search matches names, stored nicknames, aliases and common initials", () => {
  for (const query of ["NYU", " nyu ", "New York University", "new york u"]) {
    assert.equal(searchHomeColleges(colleges, query)[0].id, "nyu");
  }
  assert.equal(searchHomeColleges(colleges, "CUNY")[0].id, "cuny");
  assert.equal(searchHomeColleges(colleges, "The City University")[0].id, "cuny");
  assert.equal(searchHomeColleges(colleges, "Hunter CUNY")[0].id, "hunter");
  assert.deepEqual(searchHomeColleges(colleges, "  "), []);
  assert.deepEqual(searchHomeColleges(colleges, "No matching school"), []);
});

test("homepage tolerates absent and malformed optional college fields", () => {
  const result = publicHomeColleges([
    { id: "empty", name: "College", nickname: null, aliases: [null, 12, "Known alias"], approvedSyllabiTotal: "bad", city: null },
    { id: "bad-name", name: null },
    { id: "negative", name: "Another College", approvedSyllabiTotal: -20 },
  ]);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].aliases, ["Known alias"]);
  assert.equal(result[0].city, "");
  assert.equal(result[0].uploads, 0);
  assert.equal(result[1].uploads, 0);
  assert.equal(searchHomeColleges(result, "Known alias")[0].id, "empty");
});

test("rankings are stable and search results bounded without mutating source data", () => {
  const list = publicHomeColleges(Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `Test College ${String(i).padStart(2, "0")}`, approvedSyllabiTotal: i })));
  const original = list.map((college) => college.id);
  assert.equal(searchHomeColleges(list, "test").length, 12);
  assert.equal(topHomeColleges(list).length, 3);
  assert.deepEqual(list.map((college) => college.id), original);
  assert.deepEqual(topHomeColleges(publicHomeColleges([
    { id: "b", name: "Beta" }, { id: "a", name: "Alpha" },
  ])).map((college) => college.id), ["a", "b"]);
});
