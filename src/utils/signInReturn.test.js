import test from "node:test";
import assert from "node:assert/strict";
import { safeSignInReturn } from "./signInReturn.js";

test("sign-in returns to the same syllabus including its query string", () => {
  const path = "/college/test/subject/CS/course/CS%20101/syllabus/abc?view=pdf";
  assert.equal(safeSignInReturn(path), path);
});

test("sign-in return paths cannot redirect to external sites", () => {
  for (const path of [null, "", "https://example.com", "//example.com", "/\\example.com", "/\n/example.com"]) {
    assert.equal(safeSignInReturn(path), "/");
  }
});
