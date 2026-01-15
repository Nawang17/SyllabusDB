import { useEffect } from "react";
import "./TermsOfService.css";
import { Link } from "react-router";

export default function TermsOfService({ ismodal }) {
  useEffect(() => {
    document.title = "SyllabusDB | Terms of Service";

    !ismodal && window.scrollTo({ top: 0, behavior: "smooth" });
  }, [ismodal]);

  return (
    <div
      style={{
        marginTop: ismodal ? 0 : "40px",
        paddingTop: ismodal ? 0 : "20px",
      }}
      className="terms-container"
    >
      <h1>Terms of Service</h1>
      <p>
        <strong>Last Updated:</strong> January 15, 2026
      </p>

      <section>
        <h2>1. Purpose</h2>
        <p>
          SyllabusDB is an online platform that allows students to browse and
          upload past course syllabi for informational and course-planning
          purposes. The platform is intended for educational use only.{" "}
          <p>
            SyllabusDB does not replace official university or instructor
            materials. Course details, policies, and requirements are subject to
            change and should always be confirmed through official sources.
          </p>
        </p>
      </section>

      <section>
        <h2>2. Your Responsibilities</h2>
        <ul>
          <li>
            You may upload only course syllabi or outlines from classes you
            personally took.
          </li>
          <li>
            By uploading content, you represent and warrant that you have the
            legal right and any required permission to share the material on
            SyllabusDB, including permission from the instructor or institution
            when applicable.
          </li>
          <li>
            You may not upload confidential, restricted, or proprietary
            materials, including documents marked “do not distribute.”
          </li>
          <li>
            You may not upload exams, quizzes, homework assignments, solutions,
            textbook pages, or other instructional materials beyond syllabi or
            course outlines.
          </li>
          <li>
            You may not submit content that is false, misleading, harmful, or
            intended to misrepresent a course.
          </li>
          <li>
            You agree to use the platform respectfully and solely for legitimate
            educational purposes.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Content Review and Moderation</h2>
        <p>
          All uploads are subject to review before being published on the
          platform.
        </p>
        <p>SyllabusDB reserves the right, but not the obligation, to:</p>
        <ul>
          <li>
            Review, approve, reject, or remove any content at its discretion
          </li>
          <li>
            Remove content that violates these Terms or the Community Guidelines
          </li>
          <li>
            Restrict or revoke upload privileges for users who repeatedly
            violate platform rules
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Copyright and Takedown Requests</h2>
        <p>
          SyllabusDB respects the intellectual property rights of instructors,
          institutions, and content owners.
        </p>
        <p>
          If you are an instructor, rights holder, or authorized representative
          and believe that content on SyllabusDB infringes your rights, you may
          request removal by emailing{" "}
          <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>
        </p>
        <p>
          Please see our <Link to="/takedown">Takedown Policy</Link> for
          instructions. Valid removal requests will be reviewed promptly and
          honored when appropriate.
        </p>
      </section>

      <section>
        <h2>5. Privacy</h2>
        <p>
          Your use of SyllabusDB is subject to our{" "}
          <Link to="/privacy-policy">Privacy Policy</Link>, which explains how
          we collect, use, and protect information.
        </p>
      </section>

      <section>
        <h2>6. No Warranty</h2>
        <p>
          SyllabusDB is provided “as is” and “as available,” without warranties
          of any kind.
        </p>
        <p>We do not guarantee that:</p>
        <ul>
          <li>Uploaded syllabi are accurate, complete, or current</li>
          <li>
            Course information reflects current instructor policies or
            requirements
          </li>
        </ul>
        <p>
          Users are responsible for verifying all academic information through
          official university or instructor sources.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, SyllabusDB shall not be liable
          for any direct, indirect, incidental, or consequential damages arising
          from:
        </p>
        <ul>
          <li>Use of the platform</li>
          <li>Reliance on uploaded content</li>
          <li>Decisions made based on information found on the site</li>
        </ul>
        <p>Your use of SyllabusDB is at your own risk.</p>
      </section>

      <section>
        <h2>8. Changes to These Terms</h2>
        <p>We may update these Terms of Service from time to time.</p>
        <p>
          Continued use of the platform after changes are posted constitutes
          acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>9. Educational Use and Content Ownership</h2>
        <p>
          SyllabusDB is intended to support educational and informational use.
        </p>
        <p>
          We do not claim ownership of user-uploaded syllabi. Ownership remains
          with the original rights holder. Hosting content on SyllabusDB does
          not transfer ownership or grant exclusive rights to the platform.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          For questions, concerns, or feedback regarding these Terms of Service,
          please contact:{" "}
          <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}
