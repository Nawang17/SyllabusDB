// Only insert a separator for unambiguous alphabetic subjects and numeric
// course numbers, retaining letter and hyphenated suffixes.
export function normalizeCourseCode(input = "") {
  const cleaned = (input || "").trim().toUpperCase().replace(/\s+/g, " ");
  const match = cleaned.match(/^([A-Z&]+(?:-[A-Z&]+)*)\s*(\d+[A-Z]*(?:-[A-Z0-9]+)?)$/);
  return match ? `${match[1]} ${match[2]}` : cleaned;
}

export function extractSubject(input = "") {
  const code = normalizeCourseCode(input);
  // An explicit separator disambiguates subjects containing digits or punctuation.
  const separated = code.match(/^(\S+)\s+(?=\d)/);
  if (separated) return separated[1];
  const match = code.match(/^([A-Z&]+(?:-[A-Z&]+)*)\s*(?=\d)/);
  return match ? match[1] : code.split(" ")[0];
}

export function tokenizeCourseCode(input = "") {
  // Retain search's existing support for a hyphen before the number.
  const normalized = normalizeCourseCode(input);
  const separated = normalized.match(/^(\S+)\s+(\d+)/);
  if (separated) return { dept: separated[1], num: separated[2] };
  const match = normalized.match(
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
