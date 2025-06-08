import { useEffect } from "react";
import "./TermsOfService.css";
import { Link } from "react-router";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  return (
    <div className="terms-container">
      <h1>Terms of Service</h1>
      <p>
        <strong>Last Updated:</strong> June 8, 2025
      </p>

      <section>
        <h2>1. Purpose</h2>
        <p>
          SyllabusDB is a student-built platform where users can browse and
          upload real course syllabi to help others make informed decisions when
          selecting classes. The site is free to use and does not require login.
        </p>
      </section>

      <section>
        <h2>2. User Responsibilities</h2>
        <ul>
          <li>
            Only upload syllabi or course outlines that you personally received
            as a student.
          </li>
          <li>
            Do not upload copyrighted, private, or restricted content (e.g.
            lecture slides, exams, assignments, or materials clearly marked as
            confidential).
          </li>
          <li>Do not upload harmful or misleading files.</li>
          <li>
            Use the platform respectfully and for its intended academic purpose.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Content Moderation</h2>
        <ul>
          <li>
            All uploads are manually reviewed and scanned before appearing on
            the site.
          </li>
          <li>
            We reserve the right to reject or remove any content at any time,
            especially if it violates our guidelines or receives a takedown
            request.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Takedown Policy</h2>
        <p>
          If you are an instructor or school official and wish to remove a
          syllabus, please contact us via email. We will promptly take it down.
          Full details are available on our{" "}
          <Link to="/takedown">Takedown policy </Link>.
        </p>
      </section>

      <section>
        <h2>5. No Warranty</h2>
        <p>
          We do our best to keep SyllabusDB accurate, safe, and up to date, but
          we do not guarantee that all content is error-free, complete, or
          available at all times.
        </p>
        <p>
          Syllabi provided on this site are for reference only. We do not
          guarantee their accuracy, completeness, or applicability to future
          semesters. Instructors may update, revise, or change their syllabi at
          any time without notice.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          SyllabusDB is provided “as is.” We are not responsible for any
          decisions, academic outcomes, or consequences that result from using
          this site. Users are solely responsible for how they use the
          information provided.
        </p>
      </section>

      <section>
        <h2>7. Changes to These Terms</h2>
        <p>
          We may update these terms at any time. Continued use of the site means
          you accept any changes. We’ll post clear updates if anything major
          changes.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          Have questions or concerns? Email us at:{" "}
          <strong>katophh@gmail.com</strong>
        </p>
      </section>
      <section>
        <h2>9. Fair Use Disclaimer</h2>
        <p>
          SyllabusDB operates under the fair use provisions of Section 107 of
          the U.S. Copyright Act. The materials shared on this site are used for
          non-commercial, educational purposes to help students make informed
          course decisions.
        </p>
        <p>
          We do not claim ownership of any uploaded syllabi and will promptly
          remove any content if requested by the rights holder. Our goal is to
          provide academic transparency and equitable access to course planning
          resources.
        </p>
      </section>
    </div>
  );
}
