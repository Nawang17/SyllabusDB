import { Link } from "react-router";
import { IconMail } from "@tabler/icons-react";
import InfoPage from "../InfoPage";

export default function TakedownPage() {
  return (
    <InfoPage
      title="Takedown policy"
      intro="If a syllabus or student review raises a copyright, privacy, or safety concern, tell us so we can review it. You do not need an account to submit a request."
      updated
    >
      <section className="info-note">
        <h2>Request a review or removal</h2>
        <p>Email <a href="mailto:katophh@gmail.com">katophh@gmail.com</a> with the subject <strong>Takedown request</strong>. Include the exact SyllabusDB page link and a short explanation of the issue.</p>
        <div className="info-actions">
          <a href="mailto:katophh@gmail.com?subject=Takedown%20request"><IconMail size={18} aria-hidden="true" />Email a request</a>
        </div>
      </section>

      <section>
        <h2>What to include</h2>
        <ul>
          <li>Your name, reply email, and relationship to the content, such as instructor, student, rights holder, or authorized representative.</li>
          <li>The exact page URL for each syllabus or review. Include the PDF link too, if available.</li>
          <li>The college, course, term, and professor, if these help identify the material.</li>
          <li>The reason for the request and the specific content at issue. For a PDF, include page numbers where possible.</li>
          <li>Whether you are requesting removal, correction of course details, or review of a student comment.</li>
        </ul>
        <p>Anyone can report exposed personal information or a guideline violation. Only a copyright owner or authorized representative should make a copyright claim on the owner's behalf.</p>
      </section>

      <section>
        <h2>Copyright concerns</h2>
        <p>Explain which work you own or represent and why you believe its publication is unauthorized. SyllabusDB does not claim ownership of uploaded syllabi, and educational use alone does not establish permission to share them.</p>
        <p>For a formal copyright notice, include:</p>
        <ul>
          <li>Identification of the copyrighted work and the material you want removed, with enough detail to locate it.</li>
          <li>Your contact information, including an address, telephone number, and email address.</li>
          <li>A statement that you believe in good faith that the use is not authorized by the rights holder, their representative, or the law.</li>
          <li>A statement that your information is accurate and, under penalty of perjury, that you are authorized to act for the rights holder.</li>
          <li>Your physical or electronic signature.</li>
        </ul>
        <p>See the <a href="https://www.copyright.gov/512/" target="_blank" rel="noopener noreferrer">U.S. Copyright Office's notice-and-takedown guidance</a> for more information about formal notices.</p>
      </section>

      <section>
        <h2>Privacy and review concerns</h2>
        <p>If a file exposes student records, personal contact details, passwords, or other sensitive information, identify where it appears without repeating that information in your email. Do not send passwords or identity documents.</p>
        <p>For student reviews, identify the specific passage and explain the concern, such as harassment, private information, or misleading content. We assess reports against our <Link to="/guidelines">guidelines</Link>; disagreement with an opinion alone does not necessarily warrant removal.</p>
      </section>

      <section>
        <h2>What happens next</h2>
        <ol>
          <li>We review the request and may ask for clarification or information confirming your connection to the material.</li>
          <li>We may restrict access while reviewing a concern and remove or correct content when appropriate.</li>
          <li>We may contact the uploader or requester to explain a decision or resolve a dispute. If you believe a decision was mistaken, reply with the relevant links and supporting details.</li>
        </ol>
        <p>Review time depends on the nature of the report and the information provided. Submitting a request does not guarantee removal. Applicable legal requirements govern formal copyright notices and any counter-notices.</p>
      </section>

      <section>
        <h2>Limits of removal</h2>
        <p>We can address content hosted on SyllabusDB, but cannot recall copies already downloaded, control third-party reposts, or immediately clear search-engine caches. If a PDF is still accessible after a removal decision, reply with the working file link so we can investigate.</p>
        <p>For account information or other data requests, see the <Link to="/privacy-policy">Privacy Policy</Link>. Use of the site is also governed by our <Link to="/termsofservice">Terms of Service</Link>.</p>
      </section>
    </InfoPage>
  );
}