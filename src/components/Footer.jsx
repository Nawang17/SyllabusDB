import "./styles/Footer.css";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/aboutpage">About</Link>

          <Link to="/guidelines">Read the Guidelines</Link>
          <Link to="/colleges">All colleges</Link>
        </div>
        <div className="footer-links">
          <Link to="/uploadsyllabus">Upload</Link>

          <Link to="https://nawangs-portfolio.netlify.app/">Developer</Link>
        </div>
        <p>Built by students, for students</p>
      </div>
    </footer>
  );
}
