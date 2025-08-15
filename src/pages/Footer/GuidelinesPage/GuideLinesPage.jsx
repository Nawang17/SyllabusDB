import { useEffect } from "react";
import "./GuideLinesPage.css";

export default function GuidelinesPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="guidelines-page">
      <h1>Guidelines</h1>
      <p>
        SyllabusDB is a student-powered platform created to help others make
        better decisions when choosing classes. To keep the site reliable, safe,
        and legally compliant, please follow the guidelines below.
      </p>

      <h2>What You Can Upload</h2>
      <ul className="guidelines-list">
        <li>Official syllabi or course outlines from classes you have taken</li>
        <li>Files in PDF format only (maximum size: 5MB)</li>
        <li>
          Documents that do not contain personal information (yours or anyone
          else’s)
        </li>
        <li>Educational content that is factual and relevant to the course</li>
      </ul>

      <h2>Do Not Upload</h2>
      <ul className="guidelines-list">
        <li>Fake, altered, or misleading documents</li>
        <li>
          Homework assignments, quizzes, exams, solution keys, or textbook
          material
        </li>
        <li>
          Confidential or restricted documents, including anything marked “do
          not distribute”
        </li>
        <li>Advertisements, spam, or unrelated content</li>
      </ul>

      <h2>Keeping the Platform Safe</h2>
      <ul className="guidelines-list">
        <li>Every upload is manually reviewed before being made public</li>
        <li>Files are scanned for viruses and flagged content</li>
        <li>
          Violations may lead to rejected uploads or a permanent block from
          submitting
        </li>
      </ul>

      <h2>Legal Reminder</h2>
      <p>
        Uploads must follow U.S. fair use standards under Section 107.
        SyllabusDB is for educational, non-commercial sharing. If a rights
        holder submits a verified request, we will remove the content promptly.
      </p>

      <p className="guidelines-footer">
        This platform exists to support students. Please help keep it
        respectful, helpful, and trustworthy for everyone.
      </p>

      <i>
        Note: Syllabi are shared for reference. Instructors may change course
        structure or content in future semesters.
      </i>
    </div>
  );
}
