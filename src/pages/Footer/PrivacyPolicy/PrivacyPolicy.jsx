import { useEffect } from "react";
import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="privacy-page">
      <h1>Privacy Policy</h1>
      <p>
        <strong>Last Updated:</strong> July 06, 2025
      </p>

      <h2>1. Overview</h2>
      <p>
        SyllabusDB respects your privacy. This page outlines what data we
        collect and how it is used. By using this site, you agree to this
        policy.
      </p>

      <h2>2. Data We Collect</h2>
      <ul>
        <li>
          Anonymous usage data via Google Analytics (page views, traffic
          sources)
        </li>
        <li>Uploaded syllabi (only the files you choose to share)</li>
        <li>
          If you sign in with Google (optional), your email is used to manage
          your submissions.
        </li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <p>
        We use the collected data to improve the platform and understand usage
        trends. We do not sell, rent, or share your personal information.
      </p>

      <h2>4. Data Security</h2>
      <p>
        Your data is stored securely using Firebase. We take reasonable measures
        to protect it, but no system is completely secure.
      </p>

      <h2>5. Third-Party Services</h2>
      <p>
        We use third-party services like Google Analytics and Firebase, which
        may collect information according to their own privacy policies.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        You may request to have your uploaded content or account information
        removed at any time by contacting us.
      </p>

      <h2>7. Contact</h2>
      <p>
        If you have questions about this policy, email{" "}
        <a href="mailto:katophh@gmail.com">katophh@gmail.com</a>.
      </p>
    </div>
  );
}
