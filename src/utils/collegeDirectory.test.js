import test from "node:test";
import assert from "node:assert/strict";
import { publicHomeColleges } from "./homeColleges.js";
import { filterCollegeDirectory, groupCollegeDirectory } from "./collegeDirectory.js";

const colleges = publicHomeColleges([
  { id: "nyu", name: "New York University", city: "New York", state: "NY", approvedSyllabiTotal: 20 },
  { id: "hunter", name: "Hunter College", city: "New York", state: "NY", nickname: "Hunter", aliases: ["Hunter CUNY"], approvedSyllabiTotal: 100 },
  { id: "cal", name: "Example College", city: "Los Angeles", state: "CA", approvedSyllabiTotal: 30 },
  { id: "other", name: "Another College" },
  { id: "pending", name: "Pending College", state: "NY", approved: false },
]);

test("directory search supports abbreviations, aliases, city, state and trimmed queries", () => {
  for (const [search, expected] of [
    [" nyu ", ["nyu"]], ["Hunter CUNY", ["hunter"]],
    ["Los Angeles", ["cal"]], ["NY", ["hunter", "nyu"]],
    ["no matches", []],
  ]) assert.deepEqual(filterCollegeDirectory(colleges, { search }).map((college) => college.id), expected);
  assert.equal(filterCollegeDirectory(colleges).length, 4);
  assert.equal(filterCollegeDirectory(colleges, { search: "pending" }).length, 0);
});

test("state filtering combines with search and supports colleges without a state", () => {
  assert.deepEqual(filterCollegeDirectory(colleges, { state: "NY", search: "hunter" }).map((college) => college.id), ["hunter"]);
  assert.deepEqual(filterCollegeDirectory(colleges, { state: "CA", search: "hunter" }), []);
  assert.deepEqual(filterCollegeDirectory(colleges, { state: "Other" }).map((college) => college.id), ["other"]);
});

test("grouping sorts states and puts unknown locations last without losing college sort", () => {
  const grouped = groupCollegeDirectory(filterCollegeDirectory(colleges, { sort: "uploads" }));
  assert.deepEqual(grouped.map(([state]) => state), ["CA", "NY", "Other"]);
  assert.deepEqual(grouped[1][1].map((college) => college.id), ["hunter", "nyu"]);
  assert.deepEqual(groupCollegeDirectory([]), []);
});

test("directory returns all matches beyond the homepage's twelve-result limit", () => {
  const many = publicHomeColleges(Array.from({ length: 30 }, (_, index) => ({
    id: String(index), name: `Test College ${index}`, state: "NY",
  })));
  assert.equal(filterCollegeDirectory(many, { search: "Test" }).length, 30);
  assert.equal(filterCollegeDirectory(many, { search: "TC" }).length, 30);
});

test("directory filtering and sorting do not mutate the original list", () => {
  const original = structuredClone(colleges);
  filterCollegeDirectory(colleges, { sort: "uploads" });
  groupCollegeDirectory(colleges);
  assert.deepEqual(colleges, original);
});
