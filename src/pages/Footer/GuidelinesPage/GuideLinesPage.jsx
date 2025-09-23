// src/pages/GuidelinesPage.jsx
import { useEffect } from "react";
import "./GuideLinesPage.css";

export default function GuidelinesPage({ ismodal }) {
  useEffect(() => {
    !ismodal && window.scrollTo({ top: 0, behavior: "smooth" });
  }, [ismodal]);

  return (
    <div
      style={{ marginTop: ismodal ? 0 : "2rem" }}
      className="guidelines-page"
    >
      <h1>Guidelines</h1>
      <p>
        SyllabusDB helps students choose classes by sharing past course syllabi.
        Follow these guidelines so uploads stay useful, safe, and reviewable.
      </p>

      <h2>What You Can Upload</h2>
      <ul className="guidelines-list">
        <li>
          Official course syllabi or course outlines from classes you took
        </li>
        <li>PDF files only, up to 5 MB</li>
        <li>Documents without personal information</li>
        <li>Material that is factual and directly related to the course</li>
      </ul>

      <h2>Do Not Upload</h2>
      <ul className="guidelines-list">
        <li>Edited, fake, or misleading files</li>
        <li>Homework, quizzes, exams, solutions, or textbook pages</li>
        <li>
          Confidential or restricted documents, including files marked “do not
          distribute”
        </li>
        <li>Ads, spam, or unrelated content</li>
      </ul>

      <h2>How We Review</h2>
      <ul className="guidelines-list">
        <li>All uploads are reviewed before they appear on the site</li>
        <li>Files are scanned for malware and flagged content</li>
        <li>Violations may be rejected or lead to loss of upload access</li>
      </ul>

      <h2>Important Notes</h2>
      <ul className="guidelines-list">
        <li>
          Instructors can change courses over time. Treat syllabi as references
        </li>
        <li>
          If a rights holder requests removal with proof, we remove the content.
          See <a href="/takedown">Takedown Policy</a> for steps
        </li>
      </ul>

      <p className="guidelines-footer">
        This platform is for students. Keep it respectful, helpful, and
        accurate.
      </p>
    </div>
  );
}
