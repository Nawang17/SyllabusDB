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
        smarter decisions when choosing classes. To keep this space reliable,
        safe, and legally compliant, we ask all users to follow the guidelines
        below.
      </p>

      <h2>What You Can Upload</h2>
      <ul className="guidelines-list">
        <li>
          Official syllabi or course outlines from classes you’ve personally
          taken
        </li>
        <li>PDF format only (maximum file size: 5MB)</li>
        <li>
          Documents that do not include personal information (yours or others’)
        </li>
        <li>Materials that are factual and educational in nature</li>
      </ul>

      <h2>Do Not Upload</h2>
      <ul className="guidelines-list">
        <li>Fake, misleading, or fabricated documents</li>
        <li>
          Files containing student names, ID numbers, or personal contact
          information
        </li>
        <li>
          Assignments, quizzes, exams, solution manuals, or copyrighted textbook
          material
        </li>
        <li>
          Anything confidential, proprietary, or marked “do not distribute”
        </li>
        <li>Spam, ads, or non-academic content</li>
      </ul>

      <h2>How We Keep the Platform Safe</h2>
      <ul className="guidelines-list">
        <li>All uploads are manually reviewed before being published</li>
        <li>Files are scanned for viruses and suspicious content</li>
        <li>
          Violations may result in rejection of uploads or a permanent block
          from future submissions
        </li>
      </ul>

      <h2>Legal Reminder</h2>
      <p>
        Uploads to SyllabusDB should align with U.S. fair use guidelines under
        Section 107. This means sharing for non-commercial, educational
        purposes. We will promptly remove any content upon verified request from
        a rights holder.
      </p>

      <p className="guidelines-footer">
        SyllabusDB exists to support students. Please use it responsibly, and
        help grow a respectful, trustworthy, and useful resource for everyone.
      </p>
      <i>
        Keep in mind that syllabi are for informational use only. Instructors
        may change the structure or requirements of a course in future
        semesters.
      </i>
    </div>
  );
}
