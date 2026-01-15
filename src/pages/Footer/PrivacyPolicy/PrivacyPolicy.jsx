import { useEffect } from "react";
import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "SyllabusDB | Privacy Policy";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="privacy-page">
      <h1>Privacy Policy</h1>
      <p>
        <strong>Last Updated:</strong> January 15, 2026
      </p>

      <h2>1. Overview</h2>
      <p>
        This Privacy Policy explains what information SyllabusDB collects, how
        it is used, and the choices available to you. By using SyllabusDB, you
        agree to the collection and use of information as described in this
        policy.
      </p>

      <h2>2. Information We Collect</h2>
      <ul>
        <li>
          <strong>Usage and analytics data:</strong> We collect basic usage data
          such as page views, referral sources, and general device and browser
          information. This data may be collected through cookies or similar
          technologies and may include IP address and approximate location.
        </li>
        <li>
          <strong>Uploaded content:</strong> We collect and store files and
          metadata you submit (for example: course name, school, and upload
          date). Uploaded syllabi are intended to be publicly accessible once
          approved.
        </li>
        <li>
          <strong>Account information (optional):</strong> If you sign in with
          Google, we collect and store basic account details such as your email
          address and profile information provided by Google. This is used to
          manage submissions and support features you choose to enable (such as
          email notifications).
        </li>
      </ul>

      <h2>3. How We Use Information</h2>
      <ul>
        <li>Operate, maintain, and improve SyllabusDB</li>
        <li>Review and moderate uploads for policy compliance</li>
        <li>Communicate upload status or platform messages when you opt in</li>
        <li>Monitor for security issues, abuse, and fraud</li>
      </ul>

      <h2>4. Sharing and Disclosure</h2>
      <p>
        We do not sell or rent your personal information. We may share
        information in the following limited circumstances:
      </p>
      <ul>
        <li>
          <strong>Service providers:</strong> We use third-party services to
          host and operate the platform (for example, Firebase) and to measure
          site performance (for example, Google Analytics). These providers
          process information under their own policies.
        </li>
        <li>
          <strong>Legal and safety reasons:</strong> We may disclose information
          if required to comply with law, enforce our policies, or protect the
          rights, safety, and security of users or the platform.
        </li>
      </ul>

      <h2>5. Cookies and Analytics</h2>
      <p>
        SyllabusDB may use cookies or similar technologies to support analytics
        and platform functionality. You can control cookies through your browser
        settings. Note that disabling cookies may affect certain features.
      </p>

      <h2>6. Data Storage and Security</h2>
      <p>
        SyllabusDB stores data using Firebase. We apply reasonable safeguards to
        protect information; however, no method of storage or transmission is
        fully secure, and we cannot guarantee absolute security.
      </p>

      <h2>7. Data Retention</h2>
      <p>
        We retain information for as long as necessary to operate the platform,
        comply with legal obligations, resolve disputes, and enforce our
        policies. You may request deletion of your account information or
        uploads as described below.
      </p>

      <h2>8. Your Choices</h2>
      <ul>
        <li>
          Request removal of your uploads or deletion of your account
          information by contacting us
        </li>
        <li>Manage email notification preferences in Settings at any time</li>
        <li>Control cookies through your browser settings</li>
      </ul>

      <h2>9. Children’s Privacy</h2>
      <p>
        SyllabusDB is intended for use by college and university students. We do
        not knowingly collect personal information from children under the age
        of 13. If we become aware that such information has been collected, we
        will delete it.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        posted on this page with an updated “Last Updated” date.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy-related questions or requests, contact{" "}
        <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
      </p>
    </div>
  );
}
