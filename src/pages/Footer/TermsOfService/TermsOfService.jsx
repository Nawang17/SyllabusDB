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
        <strong>Last Updated:</strong> September 23, 2025
      </p>

      <section>
        <h2>1. Purpose</h2>
        <p>
          SyllabusDB lets students browse and upload past course syllabi to
          support informed course planning. It is free and intended for academic
          use.
        </p>
      </section>

      <section>
        <h2>2. Your Responsibilities</h2>
        <ul>
          <li>Upload only syllabi you received as a student</li>
          <li>
            Do not upload confidential, restricted, or copyrighted materials
          </li>
          <li>Do not submit harmful, false, or misleading content</li>
          <li>Use the site respectfully and for academic purposes</li>
        </ul>
      </section>

      <section>
        <h2>3. Moderation</h2>
        <ul>
          <li>Uploads are reviewed before publishing</li>
          <li>We may remove content that violates these Terms or Guidelines</li>
          <li>Repeat violations can result in loss of upload access</li>
        </ul>
      </section>

      <section>
        <h2>4. Takedown</h2>
        <p>
          Instructors, rights holders, or school officials may request removal
          by emailing <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
          See our <Link to="/takedown">Takedown Policy</Link> for details. Valid
          requests will be honored.
        </p>
      </section>

      <section>
        <h2>5. Privacy</h2>
        <p>
          See the <Link to="/privacy-policy">Privacy Policy</Link> to learn how
          we collect and use information.
        </p>
      </section>

      <section>
        <h2>6. No Warranty</h2>
        <p>
          SyllabusDB is provided as is. Content may be incomplete or outdated.
          Always confirm course details with your instructor.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          We are not liable for decisions made based on site content. You are
          responsible for how you use the information.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          We may update these Terms. Continued use means you accept the updated
          version. We will clearly communicate significant updates.
        </p>
      </section>

      <section>
        <h2>9. Fair Use</h2>
        <p>
          SyllabusDB operates under fair use principles in Section 107 of U.S.
          copyright law for educational and non-commercial purposes. We do not
          claim ownership of uploaded syllabi.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          Questions or feedback:{" "}
          <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}
