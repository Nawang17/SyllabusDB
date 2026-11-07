export function generateCollegeId(name) {
  return name.trim().toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateCollegeEdit(draft) {
  const details = {
    name: draft.name.trim(),
    city: draft.city.trim(),
    state: draft.state.trim(),
  };
  if (!details.name || !details.city || !details.state) {
    throw new Error("Enter the college name, city, and state.");
  }
  if (!generateCollegeId(details.name)) {
    throw new Error("The college name must contain letters or numbers to form a document ID.");
  }
  return details;
}

export async function applyPendingCollegeEdit(transaction, collegeRef, details, {
  destination = collegeRef,
  documents = [],
} = {}) {
  const moving = collegeRef.path !== destination.path;
  // Keep renames bounded to a single transaction, never a partial batch move.
  if (moving && documents.length > 200) {
    throw new Error("This college has too many records to rename here. Use a server-side migration; no changes were saved.");
  }
  const snapshot = await transaction.get(collegeRef);
  if (!snapshot.exists()) {
    throw new Error("This college request no longer exists. Refresh the page.");
  }
  if (snapshot.data().approved !== false) {
    throw new Error("This college request is no longer pending. Refresh the page.");
  }
  const changes = {
    name: details.name,
    city: details.city,
    state: details.state,
  };
  if (!moving) {
    transaction.update(collegeRef, changes);
    return;
  }
  const target = await transaction.get(destination);
  if (target.exists()) {
    throw new Error("A college with this document ID already exists. No changes were saved.");
  }
  const children = [];
  for (const refs of documents) {
    const source = await transaction.get(refs.source);
    const target = await transaction.get(refs.destination);
    if (!source.exists()) {
      throw new Error("College records changed during the edit. Refresh and try again.");
    }
    if (target.exists()) {
      throw new Error("The destination already contains course or syllabus records. No changes were saved.");
    }
    children.push({ ...refs, data: source.data() });
  }
  // Copy complete records, including owner, timestamps, counters and PDF paths.
  transaction.set(destination, { ...snapshot.data(), ...changes });
  for (const child of children) {
    transaction.set(child.destination, child.data);
    transaction.delete(child.source);
  }
  transaction.delete(collegeRef);
}
