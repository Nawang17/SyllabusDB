export function safeSignInReturn(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") ||
    [...value].some((character) => character === "\\" || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return "/";
  return value;
}
