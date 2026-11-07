export function publicHomeColleges(documents) {
  return documents.flatMap(({ id, ...data }) => {
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (data.approved === false || !name) return [];
    return [{
      id, name,
      nickname: typeof data.nickname === "string" ? data.nickname.trim() : "",
      aliases: Array.isArray(data.aliases) ? data.aliases.filter((alias) => typeof alias === "string") : [],
      city: typeof data.city === "string" ? data.city.trim() : "",
      state: typeof data.state === "string" ? data.state.trim() : "",
      image_url: typeof data.image_url === "string" ? data.image_url : "",
      uploads: Number.isFinite(data.approvedSyllabiTotal) ? Math.max(0, data.approvedSyllabiTotal) : 0,
    }];
  });
}

export function topHomeColleges(colleges) {
  return [...colleges].sort((a, b) => b.uploads - a.uploads || a.name.localeCompare(b.name)).slice(0, 3);
}

export function searchHomeColleges(colleges, search, maxResults = 12) {
  const query = search.trim().toLowerCase();
  if (!query) return [];
  const score = (value) => {
    const text = value.toLowerCase();
    if (text === query) return 100;
    if (text.startsWith(query)) return 80;
    if (text.includes(` ${query}`)) return 60;
    return text.includes(query) ? 40 : 0;
  };
  return colleges.map((college) => {
    const initials = college.name.split(/[^a-z0-9]+/i)
      .filter((word) => word && !/^(of|the|at|and)$/i.test(word))
      .map((word) => word[0]).join("");
    return {
      ...college,
      score: Math.max(...[college.name, college.nickname, ...college.aliases, initials].map(score)),
    };
  }).filter((college) => college.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, maxResults);
}
