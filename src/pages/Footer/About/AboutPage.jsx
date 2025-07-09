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
        SyllabusDB was built to help students make better-informed course
        decisions. Too often, official course descriptions leave out key details
        like grading, workload, and assignments.
      </p>

      <p>
        This platform offers a space to browse and share real syllabi from past
        classes. It is powered by students and created to support students.
        Whether you're planning your semester or deciding between electives,
        SyllabusDB gives you a clearer picture of what to expect.
      </p>

      <p>
        SyllabusDB is free, non-commercial, and designed for educational use.
        All syllabi are shared under fair use to support the academic community.
      </p>

      <p>
        Have a syllabus? Upload it to help others. Even one file can make a
        difference.
      </p>

      <p>
        For questions or suggestions, contact{" "}
        <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
      </p>
    </div>
  );
}
