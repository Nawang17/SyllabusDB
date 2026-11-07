import { generateCollegeId } from "./adminCollegeEdit.js";

export function validateCollegeRequest(draft) {
  const details = { name: draft.name.trim(), city: draft.city.trim(), state: draft.state.trim() };
  const errors = {};
  if (!details.name) errors.name = "Enter the college name.";
  else if (!generateCollegeId(details.name)) errors.name = "Use the full college name, including letters or numbers.";
  if (!details.city) errors.city = "Enter the city.";
  if (!details.state) errors.state = "Enter the state or region.";
  return { details, errors };
}

export async function createCollegeRequest(transaction, collegeRef, details, { owner, createdAt }) {
  const existing = await transaction.get(collegeRef);
  if (existing.exists()) return { created: false, approved: existing.data().approved !== false };
  if (!owner) throw new Error("Could not authenticate. Please try again.");
  transaction.set(collegeRef, {
    name: details.name,
    city: details.city,
    state: details.state,
    approved: false,
    createdAt,
    approvedSyllabiTotal: 0,
    image_url: null,
    owner,
  });
  return { created: true };
}
