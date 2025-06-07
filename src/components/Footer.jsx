import "./styles/Footer.css";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p className="footer-title">SyllabusDB</p>
        <div className="footer-links">
          <Link to="/aboutpage">About</Link>
          <Link to="/termsofservice">Terms of Service</Link>
          <Link to="/guidelines">Guidelines</Link>
        </div>
        <div className="footer-links">
          <Link to="/colleges">All Colleges</Link>
          <Link to="/uploadsyllabus">Upload Syllabus</Link>
          <a
            href="https://nawangs-portfolio.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Developer
          </a>
        </div>
        <p>Built by students, for students.</p>
      </div>
    </footer>
  );
}
