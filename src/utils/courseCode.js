// Only insert a separator for unambiguous alphabetic subjects and numeric
// course numbers (including the existing optional letter suffix).
export function normalizeCourseCode(input = "") {
  const cleaned = (input || "").trim().toUpperCase().replace(/\s+/g, " ");
  const match = cleaned.match(/^([A-Z&]+(?:-[A-Z&]+)*)\s*(\d+[A-Z]?)$/);
  return match ? `${match[1]} ${match[2]}` : cleaned;
}

export function extractSubject(input = "") {
  const code = normalizeCourseCode(input);
  const match = code.match(/^([A-Z&]+(?:-[A-Z&]+)*)\s*(?=\d)/);
  return match ? match[1] : code.split(" ")[0];
}

export function tokenizeCourseCode(input = "") {
  // Retain search's existing support for a hyphen before the number.
  const match = normalizeCourseCode(input).match(
    /^([A-Z&]+(?:-[A-Z&]+)*)\s*-?\s*(\d+)/,
  );
  return { dept: match?.[1] || "", num: match?.[2] || "" };
}

export function courseCodeMatches(courseCode, search) {
  if (!search) return true;
  const course = tokenizeCourseCode(courseCode);
  const query = tokenizeCourseCode(search);
  if (query.dept && course.dept && course.dept !== query.dept) return false;
  if (query.num && course.num) {
    return course.num.startsWith(query.num) || query.num.startsWith(course.num);
  }
  return normalizeCourseCode(courseCode).includes(normalizeCourseCode(search));
}
