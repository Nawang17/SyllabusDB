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
        SyllabusDB was created to solve a problem every student has faced: not
        knowing what to expect from a class before registering. Course
        descriptions are often vague, and students rarely get to see real
        details like grading breakdowns, assignments, or workload ahead of time.
      </p>

      <p>
        That is why I built <strong>SyllabusDB</strong>, a simple and
        open-access platform where students can upload and browse real syllabi
        from courses they have taken. It is designed to make course planning
        smarter, clearer, and more transparent.
      </p>

      <p>
        There is no login, no paywall, and no data harvesting. Just
        student-powered access to the information we all wish we had when
        choosing classes.
      </p>

      <p>
        If you have taken a course and still have the syllabus, consider
        uploading it to help others. One small contribution can help many
        students make better decisions.
      </p>

      <p>
        SyllabusDB is non-commercial and operates in accordance with fair use
        under Section 107 of U.S. copyright law. It focuses on factual,
        educational content shared by students to benefit other students.
      </p>

      <p>
        If you have questions, suggestions, or need to report an issue, feel
        free to reach out at{" "}
        <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
      </p>
      <p>
        Please note: All syllabi on this site are for reference only. Course
        content, grading policies, and schedules may change in future terms at
        the discretion of the instructor.
      </p>
    </div>
  );
}
