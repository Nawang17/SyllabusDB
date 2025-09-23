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
        informed course choices. We respect the rights of instructors and
        institutions and will remove content upon verified request from a rights
        holder.
      </p>

      <h2>Requesting a Takedown</h2>
      <p>
        If you are a professor, instructor, or university representative and
        want a document removed, email us with:
      </p>
      <ul>
        <li>Your full name and role (e.g., professor, department chair)</li>
        <li>The course name and description of the material</li>
        <li>The exact URL of the page where the file appears</li>
      </ul>
      <p>
        📧 <strong>Email:</strong> <code>katophh@gmail.com</code>
        <br />
        Use the subject line <strong>“DMCA Takedown”</strong> for faster review.
      </p>

      <h2>Student Uploads</h2>
      <p>
        Uploads are expected to be syllabi students received in their own
        classes. The following must not be uploaded:
      </p>
      <ul>
        <li>Exams, quizzes, or graded assignments</li>
        <li>Answer keys or solution manuals</li>
        <li>Publisher-owned or paid materials (e.g., textbook slides)</li>
        <li>Documents marked confidential or private</li>
      </ul>

      <h2>Fair Use Notice</h2>
      <p>
        Materials shared on SyllabusDB are for educational, non-commercial
        purposes under the fair use provisions of Section 107 of U.S. copyright
        law. We do not claim ownership of uploaded content.
      </p>
      <p>
        Verified takedown requests will always be honored. If your material was
        shared without permission, contact us and we will remove it promptly.
      </p>
    </div>
  );
}
