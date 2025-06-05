import "./GuideLinesPage.css";

export default function GuidelinesPage() {
  return (
    <div className="guidelines-page">
      <h1>Community Guidelines</h1>
      <p>
        SyllabusDB is a student-powered platform built to help others make
        smarter decisions when choosing classes. To keep things reliable and
        safe, we ask that you follow these simple rules when uploading content.
      </p>

      <h2>✅ What You Can Upload</h2>
      <ul className="guidelines-list">
        <li>Official syllabi from college courses you’ve taken</li>
        <li>PDF format only (max file size: 5MB)</li>
        <li>Documents that do not contain personal or sensitive information</li>
      </ul>

      <h2>🚫 What You Shouldn’t Upload</h2>
      <ul className="guidelines-list">
        <li>Fake or misleading syllabi</li>
        <li>Files that include student names, ID numbers, or contact info</li>
        <li>Spam, advertisements, or irrelevant documents</li>
      </ul>

      <h2>🔒 How We Keep Things Safe</h2>
      <ul className="guidelines-list">
        <li>All uploads are manually reviewed before being published</li>
        <li>Files are scanned using antivirus tools</li>
        <li>Violations may lead to removal of content and upload blocks</li>
      </ul>

      <p className="guidelines-footer">
        SyllabusDB exists to support students. Please use it responsibly and
        help build a helpful, respectful, and trustworthy resource.
      </p>
    </div>
  );
}
