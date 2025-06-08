import { useEffect } from "react";
import "./TakeDownPage.css";

export default function TakedownPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="takedown-page">
      <h1>Takedown Policy</h1>

      <p>
        SyllabusDB is a student-run platform created to help students make
        smarter course decisions. We respect the rights of instructors and
        institutions, and we will promptly remove any syllabus or document if
        requested by a verified rights holder.
      </p>

      <h2>How to Request a Takedown</h2>
      <p>
        If you're a professor, instructor, or university representative and
        would like a document removed, please email us with the following:
      </p>
      <ul>
        <li>Your full name and your role (e.g. professor, administrator)</li>
        <li>The course name and a description of the document in question</li>
        <li>The exact page or URL where it appears</li>
      </ul>
      <p>
        📧 <strong>Contact:</strong> <code>katophh@gmail.com</code>
        <br />
        Please include <strong>"DMCA Takedown"</strong> in the subject line for
        faster review.
      </p>

      <h2>Student Uploads</h2>
      <p>
        SyllabusDB is powered by student contributions. If you upload a
        syllabus, we assume it is a document you received as part of your own
        course experience and that you’re sharing it to help others.
      </p>
      <p>Do not upload any of the following:</p>
      <ul>
        <li>Exams, quizzes, or graded assignments</li>
        <li>Solution manuals or answer keys</li>
        <li>
          Publisher-owned content such as textbook slides or paid resources
        </li>
        <li>Any materials marked confidential or private</li>
      </ul>

      <h2>Fair Use Disclaimer</h2>
      <p>
        SyllabusDB operates under the fair use provisions of Section 107 of U.S.
        Copyright Law. We share materials for non-commercial, educational
        purposes to promote transparency in academic course planning.
      </p>
      <p>
        We do not claim ownership of uploaded documents and always honor
        takedown requests from rights holders. If you believe your material has
        been posted improperly, reach out and we’ll remove it.
      </p>
    </div>
  );
}
