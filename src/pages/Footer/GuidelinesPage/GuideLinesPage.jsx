import { useEffect } from "react";
import "./GuideLinesPage.css";

export default function GuidelinesPage({ ismodal }) {
  useEffect(() => {
    document.title = "SyllabusDB | Guidelines";
    !ismodal && window.scrollTo({ top: 0, behavior: "smooth" });
  }, [ismodal]);

  return (
    <div
      style={{ marginTop: ismodal ? 0 : "2rem" }}
      className="guidelines-page"
    >
      <h1>Community Guidelines</h1>
      <p>
        SyllabusDB is an educational platform designed to help students make
        informed course decisions by sharing past course syllabi. These
        guidelines outline what may be uploaded and how content is reviewed to
        ensure accuracy, safety, and compliance.
      </p>

      <h2>Permitted Uploads</h2>
      <ul className="guidelines-list">
        <li>
          Official course syllabi or course outlines from classes you personally
          completed
        </li>
        <li>PDF documents only, with a maximum file size of 5 MB</li>
        <li>
          Documents that do not contain personal, sensitive, or private
          information
        </li>
        <li>
          Content that is factual, unaltered, and directly related to the course
        </li>
        <li>
          Materials you have the legal right and any required permission to
          share, including permission from the instructor or institution when
          applicable
        </li>
      </ul>

      <h2>Prohibited Content</h2>
      <ul className="guidelines-list">
        <li>Edited, fabricated, misleading, or incomplete documents</li>
        <li>
          Homework assignments, quizzes, exams, solutions, textbook pages, or
          other instructional materials beyond syllabi
        </li>
        <li>
          Confidential or restricted documents, including materials marked “do
          not distribute”
        </li>
        <li>Advertisements, spam, or content unrelated to academic courses</li>
      </ul>

      <h2>Review and Enforcement</h2>
      <ul className="guidelines-list">
        <li>All uploads are reviewed prior to publication</li>
        <li>
          Files may be scanned for malware, policy violations, or restricted
          content
        </li>
        <li>
          Content that violates these Guidelines or the Terms of Service may be
          rejected or removed, and repeated violations may result in loss of
          upload privileges
        </li>
      </ul>

      <h2>Important Notices</h2>
      <ul className="guidelines-list">
        <li>
          Course syllabi may be updated by instructors over time. Uploaded
          syllabi are provided for reference only and may not reflect current
          course policies or requirements.
        </li>
        <li>
          By uploading content, you confirm that you have the right and
          permission to share the material on SyllabusDB.
        </li>
        <li>
          If an instructor, institution, or rights holder submits a valid
          removal request, the content will be removed in accordance with our{" "}
          <a href="/takedown">Takedown Policy</a>.
        </li>
      </ul>

      <p className="guidelines-footer">
        SyllabusDB is intended for responsible academic use. Users are expected
        to contribute accurate, respectful, and compliant content.
      </p>
    </div>
  );
}
