// src/pages/PrivacyPolicy.jsx
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
        <strong>Last Updated:</strong> September 23, 2025
      </p>

      <h2>1. Overview</h2>
      <p>
        This policy explains what we collect and how we use it. Using SyllabusDB
        means you agree to this policy.
      </p>

      <h2>2. Data We Collect</h2>
      <ul>
        <li>Anonymous analytics such as page views and traffic sources</li>
        <li>Uploaded files you choose to share</li>
        <li>
          If you sign in with Google (optional), we store your email and basic
          profile to manage your submissions and send notifications you opt into
        </li>
      </ul>

      <h2>3. How We Use Data</h2>
      <ul>
        <li>Operate and improve the site</li>
        <li>Moderate uploads</li>
        <li>Send status emails if you enable notifications</li>
      </ul>

      <h2>4. Sharing</h2>
      <p>We do not sell or rent your personal information.</p>

      <h2>5. Security</h2>
      <p>
        Data is stored in Firebase. We use reasonable safeguards but no system
        is perfectly secure.
      </p>

      <h2>6. Third-Party Services</h2>
      <p>
        We use Firebase and Google Analytics. Their use of information is
        covered by their own policies.
      </p>

      <h2>7. Your Choices</h2>
      <ul>
        <li>Request removal of your uploads or account information</li>
        <li>Change email notification preferences anytime in Settings</li>
      </ul>

      <h2>8. Contact</h2>
      <p>
        Email <a href="mailto:katophh@gmail.com">katophh@gmail.com</a> with
        privacy questions.
      </p>
    </div>
  );
}
