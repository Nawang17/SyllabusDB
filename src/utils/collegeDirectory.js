import { searchHomeColleges } from "./homeColleges.js";

export function filterCollegeDirectory(colleges, { search = "", state = "", sort = "name" } = {}) {
  const query = search.trim().toLowerCase();
  const nameMatches = new Set(searchHomeColleges(colleges, query, Infinity).map((college) => college.id));
  return colleges.filter((college) => {
    if (state && (college.state || "Other") !== state) return false;
    return !query || nameMatches.has(college.id) ||
      [college.city, college.state].some((location) => location.toLowerCase().includes(query));
  }).sort((a, b) => {
    if (sort === "uploads" && a.uploads !== b.uploads) return b.uploads - a.uploads;
    return a.name.localeCompare(b.name);
  });
}

export function groupCollegeDirectory(colleges) {
  const groups = new Map();
  for (const college of colleges) {
    const state = college.state || "Other";
    if (!groups.has(state)) groups.set(state, []);
    groups.get(state).push(college);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });
}
