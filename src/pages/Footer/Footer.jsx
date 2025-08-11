import { Text } from "@mantine/core";
import "./Footer.css";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <Text fw={900} className="brand">
            Syllabus<span className="brand-accent">DB</span>
          </Text>
          <p className="tagline">Built by students to help students succeed.</p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/aboutpage">About</Link>
          <Link to="/guidelines">Guidelines</Link>
          <Link to="/colleges">All Colleges</Link>
          <Link to="/termsofservice">Terms of Service</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </nav>
      </div>
    </footer>
  );
}
