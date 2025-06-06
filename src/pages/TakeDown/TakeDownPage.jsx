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
        SyllabusDB is a student-run platform built to help students make smarter
        course choices. We respect professors’ and schools’ rights and will
        promptly remove any syllabus or material if asked.
      </p>

      <h2>How to Request a Takedown</h2>
      <p>
        If you're an instructor or university official and you would like us to
        remove a syllabus, please email us with the following:
      </p>
      <ul>
        <li>Your name and role (e.g., professor, administrator)</li>
        <li>The course and document in question</li>
        <li>The exact page or URL</li>
      </ul>
      <p>
        📧 <strong>Contact us at:</strong> <code>katophh@gmail.com</code>
      </p>

      <h2>Student Uploads</h2>
      <p>
        SyllabusDB is powered by students. If you upload a syllabus, we assume
        it’s something you got from taking the class and want to share to help
        others.
      </p>
      <p>
        Please avoid uploading anything private or personal, just the syllabus
        PDF or course outline is perfect. If something ever needs to be removed,
        we’ll take care of it.
      </p>

      <h2>Fair Use Disclaimer</h2>
      <p>
        We believe sharing syllabi in this way helps students and falls under
        fair use, especially when not used commercially. But we are always happy
        to cooperate with takedown requests.
      </p>
    </div>
  );
}
