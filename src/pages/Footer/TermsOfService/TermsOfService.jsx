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
        <strong>Last Updated:</strong> July 06, 2025
      </p>

      <section>
        <h2>1. Purpose</h2>
        <p>
          SyllabusDB is a student-run platform for browsing and uploading course
          syllabi to support informed course planning. It is free to use and
          designed for the academic community.
        </p>
      </section>

      <section>
        <h2>2. User Responsibilities</h2>
        <ul>
          <li>Only upload syllabi you received as a student.</li>
          <li>
            Do not upload copyrighted, restricted, or confidential materials.
          </li>
          <li>Do not submit harmful, false, or misleading content.</li>
          <li>Use the platform respectfully and for academic purposes only.</li>
        </ul>
      </section>

      <section>
        <h2>3. Content Moderation</h2>
        <ul>
          <li>All uploads are reviewed before being published.</li>
          <li>
            We may remove content that violates guidelines or upon valid
            takedown requests.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Takedown Policy</h2>
        <p>
          Instructors, rights holders, or school officials may request content
          removal by emailing{" "}
          <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>. For details,
          visit our <Link to="/takedown">Takedown Policy</Link>.
        </p>
      </section>

      <section>
        <h2>5. Privacy and Analytics</h2>
        <p>
          We use Google Analytics to collect anonymous usage data like page
          views and traffic sources. This helps us improve the site. We do not
          sell or share personal information.
        </p>
      </section>

      <section>
        <h2>6. No Warranty</h2>
        <p>
          We strive for accuracy, but content may contain errors or become
          outdated. Syllabi are for reference only. Always check with your
          instructor for the most current information.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          SyllabusDB is provided as-is. We are not responsible for academic or
          personal decisions based on site content. Users assume full
          responsibility for how they use the information.
        </p>
      </section>

      <section>
        <h2>8. Changes to These Terms</h2>
        <p>
          We may update these terms at any time. Continued use of the site
          indicates acceptance of the latest version. Significant updates will
          be clearly communicated.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          For questions or feedback, email{" "}
          <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>10. Fair Use Disclaimer</h2>
        <p>
          SyllabusDB operates under fair use provisions of Section 107 of the
          U.S. Copyright Act. Materials are shared for educational,
          non-commercial purposes to help students make informed choices.
        </p>
        <p>
          We do not claim ownership of uploaded syllabi. Verified removal
          requests will be honored.
        </p>
      </section>
    </div>
  );
}
