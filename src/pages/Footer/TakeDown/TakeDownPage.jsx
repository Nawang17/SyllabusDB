// src/pages/TakedownPage.jsx
import { useEffect } from "react";
import "./TakeDownPage.css";

export default function TakedownPage() {
  useEffect(() => {
    document.title = "SyllabusDB | Takedown Policy";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="takedown-page">
      <h1>Takedown Policy</h1>

      <p>
        SyllabusDB is an educational platform that allows students to share past
        course syllabi for informational and course-planning purposes. We
        respect the intellectual property rights of instructors, institutions,
        and other content owners and respond promptly to valid removal requests.
      </p>

      <h2>Submitting a Takedown Request</h2>
      <p>
        If you are an instructor, rights holder, or authorized institutional
        representative and believe that content on SyllabusDB should be removed,
        please submit a takedown request by email including the information
        listed below.
      </p>

      <ul>
        <li>Your full name and role or affiliation</li>
        <li>
          Identification of the course and a brief description of the material
          in question
        </li>
        <li>The exact URL(s) where the content appears on SyllabusDB</li>
      </ul>

      <p>
        <strong>Email:</strong> <code>katophh@gmail.com</code>
        <br />
        Please use the subject line <strong>“Takedown Request”</strong> to help
        ensure timely review.
      </p>

      <h2>Review Process</h2>
      <p>
        Upon receipt of a complete and verifiable request, SyllabusDB will
        review the submission and remove the identified content when
        appropriate. We may contact the requester for clarification if
        additional information is required.
      </p>

      <p>
        Valid takedown requests will be honored promptly. Removal decisions are
        made in good faith and in accordance with our Terms of Service.
      </p>

      <h2>Student Upload Expectations</h2>
      <p>
        Students may upload only course syllabi or outlines from classes they
        personally completed and for which they have permission to share. The
        following materials are not permitted on SyllabusDB:
      </p>

      <ul>
        <li>Exams, quizzes, graded assignments, or assessment materials</li>
        <li>Answer keys, solution manuals, or instructor-only resources</li>
        <li>
          Publisher-owned, paid, or licensed instructional materials (such as
          textbook slides)
        </li>
        <li>Documents marked confidential, private, or restricted</li>
      </ul>

      <h2>Educational Use and Ownership</h2>
      <p>
        SyllabusDB does not claim ownership of uploaded syllabi. Ownership
        remains with the original rights holder. Content is hosted for
        educational and informational purposes only.
      </p>

      <p>
        If you believe material has been shared without proper authorization,
        please contact us using the process above and we will address the issue
        promptly.
      </p>
    </div>
  );
}
