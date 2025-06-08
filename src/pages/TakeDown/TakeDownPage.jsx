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
        SyllabusDB is a student-run platform created to help others make smarter
        course decisions. We respect the rights of professors and universities
        and will promptly remove any syllabus or material upon request.
      </p>

      <h2>How to Request a Takedown</h2>
      <p>
        If you're an instructor or university representative and would like a
        document removed, please email us with:
      </p>
      <ul>
        <li>Your name and role (for example, professor or administrator)</li>
        <li>The course name and document in question</li>
        <li>The exact page or URL</li>
      </ul>
      <p>
        📧 <strong>Contact:</strong> <code>katophh@gmail.com</code>
        <br />
        Please include <strong>"DMCA Takedown"</strong> in the subject line.
      </p>

      <h2>Student Uploads</h2>
      <p>
        SyllabusDB relies on student contributions. If you upload a syllabus, we
        assume it is something you received while taking the class and want to
        share to help others.
      </p>
      <p>
        Please do not upload:
        <ul>
          <li>Exams, quizzes, or assignments</li>
          <li>Solution manuals or answer keys</li>
          <li>
            Publisher-owned content like textbook slides or paid resources
          </li>
          <li>Anything private, confidential, or copyrighted</li>
        </ul>
      </p>

      <h2>Fair Use Disclaimer</h2>
      <p>
        We believe sharing syllabi to help with course planning qualifies as
        fair use, especially when used non-commercially and in limited scope.
        However, we always cooperate with takedown requests.
      </p>
    </div>
  );
}
