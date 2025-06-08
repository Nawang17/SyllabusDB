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
          <Link to="takedown">Takedown Policy</Link>
        </div>
        {/* <div className="footer-links">
          <Link to="/colleges">All Colleges</Link>
          <Link to="/uploadsyllabus">Upload Syllabus</Link>
        </div> */}
        <p>Built by students, for students.</p>
      </div>
    </footer>
  );
}
