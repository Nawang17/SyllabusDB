import { Link } from "react-router";
import { IconBrandGithub, IconMail } from "@tabler/icons-react";
import "./Footer.css";

export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-inner">
      <div className="footer-main">
        <div className="footer-brand"><Link className="footer-wordmark" to="/">Syllabus<span>DB</span></Link><p>Know your class before you enroll.</p><div className="footer-contact"><a href="mailto:katophh@gmail.com"><IconMail size={18} aria-hidden="true" />Contact</a><a href="https://github.com/Nawang17/SyllabusDB" target="_blank" rel="noopener noreferrer"><IconBrandGithub size={18} aria-hidden="true" />GitHub</a></div></div>
        <nav className="footer-group" aria-label="Explore"><h2>Explore</h2><Link to="/colleges">All colleges</Link><Link to="/uploadsyllabus">Upload a syllabus</Link><Link to="/requestcollege">Request a college</Link></nav>
        <nav className="footer-group" aria-label="About and support"><h2>About &amp; support</h2><Link to="/aboutpage">About SyllabusDB</Link><Link to="/guidelines">Upload guidelines</Link><Link to="/takedown">Request removal</Link></nav>
      </div>
      <div className="footer-bottom"><p>&copy; {new Date().getFullYear()} SyllabusDB. Built by students.</p><nav aria-label="Legal"><Link to="/termsofservice">Terms of service</Link><Link to="/privacy-policy">Privacy policy</Link></nav></div>
      <p className="footer-note">An independent project. Past syllabi are for reference; confirm current requirements with your instructor.</p>
    </div>
  </footer>;
}