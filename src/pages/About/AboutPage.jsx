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
        This is why I built <strong>SyllabusDB</strong>, a simple and
        student-powered platform where users can upload and browse real syllabi
        from CUNY courses. The goal is to make course planning easier, clearer,
        and more informed.
      </p>

      <p>
        Uploading a syllabus does not require an account. However, if you choose
        to sign in with Google, you will be able to manage and keep track of
        your submissions. Signing in is optional, and your information is never
        shared or used for advertising.
      </p>

      <p>
        SyllabusDB is free to use and non-commercial. There are no subscriptions
        or paywalls. The site uses Google Analytics to collect anonymous usage
        statistics, such as page views and traffic sources, to help improve the
        platform. No personal information is ever sold or used for advertising.
      </p>

      <p>
        If you have taken a course and still have the syllabus, consider
        uploading it to help others. A small action can make a big difference
        for students trying to choose the right classes.
      </p>

      <p>
        SyllabusDB follows the principles of fair use under Section 107 of U.S.
        copyright law. It is intended for educational use and shares factual,
        course-related materials to benefit the student community.
      </p>

      <p>
        For feedback, suggestions, or issues, please contact{" "}
        <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
      </p>

      <p>
        Note: All syllabi on this site are for reference only. Course content,
        grading policies, and schedules may vary depending on the instructor or
        term.
      </p>
    </div>
  );
}
