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
        <strong>Last Updated:</strong> June 20, 2025
      </p>

      <section>
        <h2>1. Purpose</h2>
        <p>
          SyllabusDB is a student-created platform where users can browse and
          upload real course syllabi to help others make informed decisions when
          selecting classes. The site is free to use, and uploading does not
          require a login. However, optional sign-in with Google is available
          for users who wish to manage their submissions.
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
            lecture slides, exams, assignments, or materials marked as
            confidential).
          </li>
          <li>Do not upload harmful, false, or misleading content.</li>
          <li>
            Use the platform respectfully and only for its intended academic
            purpose.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Content Moderation</h2>
        <ul>
          <li>
            All uploads are manually reviewed before they appear publicly on the
            site.
          </li>
          <li>
            We reserve the right to remove any content that violates our
            guidelines or is subject to a takedown request.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Takedown Policy</h2>
        <p>
          If you are an instructor, rights holder, or school official and wish
          to request the removal of content, please contact us at{" "}
          <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>. We respond
          promptly to valid takedown requests. For more details, see our{" "}
          <Link to="/takedown">Takedown Policy</Link>.
        </p>
      </section>

      <section>
        <h2>5. Privacy and Analytics</h2>
        <p>
          SyllabusDB uses Google Analytics to track anonymous usage data, such
          as page views and traffic sources. This helps us improve the site and
          understand general usage trends. No personal information is sold,
          shared, or used for advertising.
        </p>
        <p>
          If you choose to sign in with Google, your email is securely handled
          by Firebase Auth and used only to associate your uploads with your
          account. You can choose to remain anonymous or use the site without
          signing in.
        </p>
      </section>

      <section>
        <h2>6. No Warranty</h2>
        <p>
          We do our best to ensure the accuracy and safety of SyllabusDB, but we
          do not guarantee that all content is error-free or always available.
        </p>
        <p>
          Syllabi are provided for reference only. Course content, grading, and
          policies may change without notice. Always consult your official
          course syllabus from your instructor.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          SyllabusDB is provided as-is. We are not liable for any academic or
          personal decisions made based on the content of this site. Users are
          responsible for how they use the information provided.
        </p>
      </section>

      <section>
        <h2>8. Changes to These Terms</h2>
        <p>
          We may update these terms at any time. Continued use of the site means
          you agree to the latest version. Significant changes will be clearly
          announced.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Have questions, concerns, or suggestions? Contact us at{" "}
          <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>10. Fair Use Disclaimer</h2>
        <p>
          SyllabusDB operates under the fair use provisions of Section 107 of
          the U.S. Copyright Act. Materials shared on this site are used for
          educational and non-commercial purposes to help students make informed
          decisions.
        </p>
        <p>
          We do not claim ownership of any uploaded syllabi. Any requests for
          removal from verified rights holders will be honored.
        </p>
      </section>
    </div>
  );
}
