import { useEffect } from "react";
import "./AboutPage.css";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="about-page">
      <h1>About SyllabusDB</h1>

      <p>
        Picking classes can be stressful. Course catalogs usually give you the
        basics but leave out the details that really matter: grading policies,
        workload, weekly topics, and the kinds of assignments you’ll face.
        That’s where SyllabusDB comes in.
      </p>

      <h2>What You’ll Find Here</h2>
      <ul>
        <li>Real syllabi from past semesters shared by other students</li>
        <li>Practical details that help set clear expectations</li>
        <li>
          A growing library that gets better every time someone contributes
        </li>
      </ul>

      <h2>How It Works</h2>
      <ul>
        <li>Upload a syllabus you’ve received (PDF format)</li>
        <li>Every upload is reviewed before it’s published</li>
        <li>Sign in if you’d like to track your uploads or get updates</li>
      </ul>

      <h2>What SyllabusDB Is Not</h2>
      <ul>
        <li>We don’t host exams, quizzes, answer keys, or textbook material</li>
        <li>
          These syllabi are for reference only. Always follow your instructor’s
          official syllabus for the current semester.
        </li>
      </ul>

      <h2>Why It’s Free</h2>
      <p>
        SyllabusDB is student-run and non-commercial. It’s here to help the
        academic community, not to make money. Everything is shared under fair
        use. If a rights holder asks us to remove something, we’ll take it down
        right away.
      </p>

      <h2>How You Can Help</h2>
      <p>
        If you’ve got an old syllabus, consider uploading it. Even one file can
        give another student the clarity they need to plan with confidence.
      </p>

      <p style={{ marginTop: "1rem" }}>
        Got questions or ideas? Reach out at{" "}
        <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>. We’d love to
        hear from you.
      </p>
    </div>
  );
}
