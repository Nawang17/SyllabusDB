import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCourseCode, extractSubject, courseCodeMatches } from "./courseCode.js";

test("normalizes CUNY and hyphenated subjects consistently", () => {
  for (const [input, expected] of [
    ["csci12800", "CSCI 12800"],
    ["CSCI 12800", "CSCI 12800"],
    ["csci 12800", "CSCI 12800"],
    ["CS-GY 9215", "CS-GY 9215"],
    ["cs-gy9215", "CS-GY 9215"],
    ["CS-GY9215", "CS-GY 9215"],
    ["cs-gy 9215", "CS-GY 9215"],
    ["MATH 101", "MATH 101"],
    ["  cs-gy\t 9215  ", "CS-GY 9215"],
    ["CSCI 101a", "CSCI 101A"],
    ["csci101ab", "CSCI 101AB"],
    ["cs-gy9215-a", "CS-GY 9215-A"],
    ["A&B101", "A&B 101"],
    ["ABC-DE-FG123", "ABC-DE-FG 123"],
  ]) {
    assert.equal(normalizeCourseCode(input), expected);
    assert.equal(normalizeCourseCode(expected), expected);
  }
});

test("preserves ambiguous, invalid and incomplete formats without deleting characters", () => {
  for (const input of ["", "CS-GY", "CS-", "123", "CS 101/102", "CS 101.5", "CS 101 AB", "CS - GY 9215"]) {
    assert.equal(normalizeCourseCode(input), input);
  }
  assert.equal(normalizeCourseCode(null), "");
});

test("extracts the entire subject from spaced and legacy compact codes", () => {
  for (const [code, subject] of [
    ["CSCI 12800", "CSCI"], ["CS-GY 9215", "CS-GY"],
    ["MATH 101", "MATH"], ["CSCI12800", "CSCI"],
    ["CS-GY9215", "CS-GY"], [" cs-gy\t9215 ", "CS-GY"],
    ["A&B101", "A&B"], ["", ""],
  ]) assert.equal(extractSubject(code), subject);
});

test("search handles compact, spaced, partial and hyphenated codes", () => {
  for (const query of ["cs-gy9215", "CS-GY 921", "CS-GY", "9215", ""]) {
    assert.equal(courseCodeMatches("CS-GY 9215", query), true);
    assert.equal(courseCodeMatches("CS-GY9215", query), true);
  }
  assert.equal(courseCodeMatches("CS-GY 9215", "CS-UY 9215"), false);
  assert.equal(courseCodeMatches("CSCI 12800", "csci128"), true);
  assert.equal(courseCodeMatches("CSCI 12800", "CSCI-128"), true);
  assert.equal(courseCodeMatches("MATH 101", "CSCI101"), false);
});

test("explicitly separated subjects can contain digits and punctuation", () => {
  for (const [code, subject] of [["2D 101A", "2D"], ["CS2 101", "CS2"], ["ENG/LIT 201H", "ENG/LIT"], ["CS-GY 9215", "CS-GY"]]) {
    assert.equal(normalizeCourseCode(code.toLowerCase()), code);
    assert.equal(extractSubject(code), subject);
    assert.equal(courseCodeMatches(code, `${subject} 10`), code.includes(' 10'));
  }
  assert.equal(normalizeCourseCode('CS-GY 9215 AB'), 'CS-GY 9215 AB');
  assert.equal(extractSubject('CS-GY 9215 AB'), 'CS-GY');
});
