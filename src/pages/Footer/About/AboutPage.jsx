import { useEffect } from "react";
import "./AboutPage.css";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.title = "About SyllabusDB";
  }, []);

  return (
    <div className="about-page">
      <h1>About SyllabusDB</h1>

      <p>
        Choosing classes can be challenging. Course catalogs often provide
        high-level descriptions but leave out practical details such as grading
        policies, workload expectations, weekly topics, and assignment types.
        SyllabusDB exists to help students better understand what to expect
        before enrolling.
      </p>

      <h2>What You’ll Find</h2>
      <ul>
        <li>Course syllabi from past semesters shared by students</li>
        <li>
          Practical information that helps clarify course structure and
          expectations
        </li>
        <li>
          A growing, community-supported library that improves as more students
          contribute
        </li>
      </ul>

      <h2>How the Platform Works</h2>
      <ul>
        <li>Students may upload syllabi they received in their own courses</li>
        <li>All submissions are reviewed before being published</li>
        <li>
          Optional sign-in allows users to track submissions and receive updates
        </li>
      </ul>

      <h2>What SyllabusDB Does Not Provide</h2>
      <ul>
        <li>
          Exams, quizzes, homework assignments, answer keys, or textbook
          materials
        </li>
        <li>
          Official or current course requirements for any specific semester
        </li>
      </ul>

      <p>
        Uploaded syllabi are provided for reference only. Course content,
        grading policies, and requirements may change over time and should
        always be confirmed through official instructor or institutional
        sources.
      </p>

      <h2>Respect for Instructors and Institutions</h2>
      <p>
        SyllabusDB respects the intellectual property rights of instructors and
        institutions. We do not claim ownership of uploaded syllabi. If an
        instructor, institution, or rights holder requests removal of material,
        we review and honor valid requests in accordance with our{" "}
        <a href="/takedown">Takedown Policy</a>.
      </p>

      <h2>How You Can Contribute</h2>
      <p>
        If you have a past syllabus that you are permitted to share, your
        contribution can help other students plan more confidently and make
        informed academic decisions.
      </p>

      <p style={{ marginTop: "1rem" }}>
        Questions or feedback? Contact us at{" "}
        <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
      </p>
    </div>
  );
}
