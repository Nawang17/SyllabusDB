import { normalizeCourseCode } from "./courseCode.js";

export const COURSE_TERMS = ["Spring", "Summer", "Fall", "Winter"];

export function validateSyllabusEdit(draft) {
  const courseCode = normalizeCourseCode(draft.courseCode);
  const courseTitle = draft.courseTitle.trim();
  const year = Number(draft.year);
  if (!courseCode || courseCode.includes("/") || [...courseCode].some((character) => character.charCodeAt(0) < 32) || [".", ".."].includes(courseCode)) {
    throw new Error("Enter a course code without slashes or control characters.");
  }
  if (!courseTitle) throw new Error("Enter a course name.");
  if (!/^\d{4}$/.test(String(draft.year)) || !Number.isInteger(year) || year < 1000) {
    throw new Error("Enter a four-digit year.");
  }
  if (!COURSE_TERMS.includes(draft.term)) throw new Error("Select a valid term.");
  return { courseCode, courseTitle, year, term: draft.term };
}

// All reads precede writes so Firestore can retry the entire edit safely.
export async function applyPendingSyllabusEdit(transaction, refs, edit) {
  const moving = refs.source.path !== refs.destination.path;
  const source = await transaction.get(refs.source);
  const course = await transaction.get(refs.course);
  const destination = moving ? await transaction.get(refs.destination) : null;
  if (!source.exists()) throw new Error("This upload no longer exists. Refresh the page.");
  if (source.data().approved !== false) throw new Error("This upload is no longer pending. Refresh the page.");
  if (destination?.exists()) throw new Error("An upload with this ID already exists in the destination course. No changes were saved.");

  transaction.set(refs.course, {
    code: edit.courseCode,
    title: edit.courseTitle,
    ...(course.exists() ? {} : { approved: false }),
  }, { merge: true });
  const details = { year: edit.year, term: edit.term };
  if (moving) {
    transaction.set(refs.destination, { ...source.data(), ...details });
    transaction.delete(refs.source);
  } else {
    transaction.update(refs.source, details);
  }
}

// Run after the move commits. Check the actual collection, not an approval
// counter or the admin's pending-only list, which omit other uploads.
export async function cleanupEmptySourceCourse(source, destination, { hasSyllabi, deleteCourse }) {
  const sourceCourse = source.parent.parent;
  if (sourceCourse.path === destination.parent.parent.path) return false;
  if (await hasSyllabi(sourceCourse)) return false;
  await deleteCourse(sourceCourse);
  return true;
}
