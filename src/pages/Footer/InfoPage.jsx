import { useEffect } from "react";
import { NavLink } from "../../lib/navigation.jsx";
import { IconMail } from "@tabler/icons-react";
import "./InfoPage.css";

const pages = [["/aboutpage", "About"], ["/guidelines", "Guidelines"], ["/termsofservice", "Terms of service"], ["/privacy-policy", "Privacy policy"], ["/takedown", "Removal requests"]];

export default function InfoPage({ title, intro, updated, ismodal = false, children }) {
  useEffect(() => {
    if (ismodal) return;
    window.scrollTo(0, 0);
  }, [title, ismodal]);

  const content = <article className="info-article">
    <header className="info-header"><h1>{title}</h1><p className="info-intro">{intro}</p>{updated && <p className="info-updated">Last updated <time dateTime="2026-11-06">November 6, 2026</time></p>}</header>
    <div className="info-content">{children}</div>
  </article>;

  if (ismodal) return <div className="info-page info-modal">{content}</div>;
  return <main className="info-page"><div className="info-layout">
    <aside className="info-sidebar"><nav aria-label="About and policies">{pages.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? "is-active" : undefined}>{label}</NavLink>)}</nav><a className="info-contact" href="mailto:katophh@gmail.com"><IconMail size={17} aria-hidden="true" />Contact us</a></aside>
    {content}
  </div></main>;
}
