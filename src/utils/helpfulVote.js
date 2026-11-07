// Read both documents before writing so concurrent tabs cannot double-count.
export async function toggleHelpfulVote(transaction, { syllabusRef, voteRef, statsRef, createdAt }) {
  const syllabus = await transaction.get(syllabusRef);
  if (!syllabus.exists() || syllabus.data().approved !== true) {
    throw new Error("Only published syllabi can be marked helpful.");
  }
  const vote = await transaction.get(voteRef);
  const stats = await transaction.get(statsRef);
  const count = stats.exists() ? stats.data().count : 0;
  if (!Number.isSafeInteger(count) || count < 0 || (vote.exists() && count === 0)) {
    throw new Error("Helpful count is unavailable. Please try again later.");
  }
  const helpful = !vote.exists();
  const nextCount = count + (helpful ? 1 : -1);
  if (helpful) transaction.set(voteRef, { createdAt });
  else transaction.delete(voteRef);
  transaction.set(statsRef, { count: nextCount });
  return { helpful, count: nextCount };
}
