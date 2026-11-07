import { normalizeCourseCode } from "./courseCode.js";

export const MAX_SYLLABUS_BYTES = 5 * 1024 * 1024;

export function syllabusFileError(file) {
  if (!file) return "Choose a syllabus PDF.";
  if (file.type !== "application/pdf") return "Choose a PDF file.";
  if (!file.size) return "This PDF is empty. Choose another file.";
  if (file.size > MAX_SYLLABUS_BYTES) return "PDF must be 5 MB or smaller.";
  return "";
}

export function syllabusDetailsError({ collegeId, courseCode, courseTitle, professor, term, year }) {
  if (!collegeId) return "Choose your college.";
  const code = normalizeCourseCode(courseCode);
  if (!code || code.includes("/") || [".", ".."].includes(code)) return "Enter a course code without slashes.";
  if (!courseTitle.trim()) return "Enter the course name.";
  if (!professor.trim()) return "Enter the professor's name.";
  if (!["Fall", "Spring", "Summer", "Winter"].includes(term)) return "Choose a term.";
  if (!/^\d{4}$/.test(String(year)) || Number(year) < 1000) return "Enter a four-digit year.";
  return "";
}
