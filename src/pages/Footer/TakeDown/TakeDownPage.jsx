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
        SyllabusDB is a student-run platform designed to help students make
        better course decisions. We respect the rights of instructors and
        institutions, and we will promptly remove any document upon request from
        a verified rights holder.
      </p>

      <h2>How to Request a Takedown</h2>
      <p>
        If you are a professor, instructor, or university representative and
        would like a document removed, please send an email including the
        following:
      </p>
      <ul>
        <li>Your full name and role (e.g. professor, department head)</li>
        <li>The course name and a brief description of the material</li>
        <li>The exact URL or page where the content appears</li>
      </ul>
      <p>
        📧 <strong>Contact:</strong> <code>katophh@gmail.com</code>
        <br />
        Please use <strong>"DMCA Takedown"</strong> as the subject line for
        quicker review.
      </p>

      <h2>About Student Uploads</h2>
      <p>
        SyllabusDB relies on contributions from students. We assume uploads are
        course syllabi you received as part of your own academic experience,
        shared to support fellow students.
      </p>
      <p>Do not upload:</p>
      <ul>
        <li>Exams, quizzes, or graded assignments</li>
        <li>Answer keys or solution manuals</li>
        <li>
          Publisher-owned content such as textbook slides or paid materials
        </li>
        <li>Any files labeled confidential or private</li>
      </ul>

      <h2>Fair Use Notice</h2>
      <p>
        SyllabusDB follows fair use guidelines under Section 107 of the U.S.
        Copyright Act. All materials are shared for educational, non-commercial
        use to improve transparency in course planning.
      </p>
      <p>
        We do not claim ownership of any uploaded documents. Takedown requests
        from verified rights holders will always be honored. If your material
        was shared without permission, contact us and we will remove it
        promptly.
      </p>
    </div>
  );
}
