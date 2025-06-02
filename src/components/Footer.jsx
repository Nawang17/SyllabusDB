import "./styles/Footer.css";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/aboutpage">About</Link>
          <Link to="/uploadsyllabus">Upload</Link>
          <Link to="https://nawang.xyz/">Developer</Link>
        </div>
        <p>Built by students, for students</p>
      </div>
    </footer>
  );
}
