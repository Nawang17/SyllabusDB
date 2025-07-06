import { Text } from "@mantine/core";
import "./Footer.css";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <Text
          fw={800}
          size="2rem"
          style={{
            fontFamily: "Inter, Roboto, sans-serif",
            letterSpacing: -0.5,
          }}
        >
          Syllabus<span style={{ color: "#1E88E5" }}>DB</span>
        </Text>
        <nav className="footer-links">
          <Link to="/aboutpage">About</Link>
          <Link to="/termsofservice">Terms of Service</Link>
          <Link to="/guidelines">Guidelines</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </nav>
        <p className="footer-note">
          Built by students to help students succeed.
        </p>
      </div>
    </footer>
  );
}
