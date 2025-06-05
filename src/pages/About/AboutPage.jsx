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
        I’m a student at CUNY Hunter College, and I always wished I could see a
        course syllabus before enrolling. I wanted to know what the grading
        breakdown was like, how the professor structured the class, and whether
        it would be a good fit for me.
      </p>
      <p>
        That's why I built <strong>SyllabusDB</strong>, a simple platform where
        students can upload and browse real course syllabi. It’s meant to help
        you make smarter decisions when picking classes, especially when course
        descriptions just aren’t enough.
      </p>
      <p>
        There’s no login, no paywall, just open, student-powered access to info
        that actually helps.
      </p>
      <p>
        If you have a syllabus from a course you’ve taken, please hit upload and
        pay it forward.
      </p>
      <p>
        If you have any questions, spot issues with the data, want to suggest a
        feature, or just have feedback, feel free to reach out at{" "}
        <a href="mailto:nawang.sherpa99@login.cuny.edu">katophh@gmail.com</a>.
      </p>
    </div>
  );
}
