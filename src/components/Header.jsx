import { useNavigate } from "react-router";
import "./styles/Header.css";

export default function Header() {
  const navigate = useNavigate();
  return (
    <header className="header">
      <div className="header-side"></div>
      <div onClick={() => navigate("/")} className="header-title">
        SyllabusDB
      </div>
      <div className="header-side" />
    </header>
  );
}
