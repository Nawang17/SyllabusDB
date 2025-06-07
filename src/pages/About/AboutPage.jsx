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
        SyllabusDB was created to solve a common problem students face: not
        knowing what to expect from a class before registering. Course
        descriptions are often vague, and there’s rarely a way to see things
        like grading breakdowns, workload, or course structure in advance.
      </p>
      <p>
        That’s why I built <strong>SyllabusDB</strong>, a simple, open-access
        platform where students can upload and browse real course syllabi. It's
        designed to make course planning smarter and more transparent.
      </p>
      <p>
        There’s no login, no paywall, just student-powered access to the
        information we all wish we had before choosing classes.
      </p>
      <p>
        If you’ve taken a course and have a syllabus, consider uploading it to
        help others. A small contribution can make a big difference.
      </p>
      <p>
        If you have questions, feedback, or spot an issue, feel free to reach
        out at <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
      </p>
    </div>
  );
}
