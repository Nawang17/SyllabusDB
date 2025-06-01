import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../../firebaseConfig";
import { useNavigate } from "react-router";
import { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/admin");
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in with Google.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h2>🔐 Admin Login</h2>
      <button
        onClick={handleLogin}
        style={{
          padding: "10px 20px",
          fontSize: "1rem",
          marginTop: "1rem",
          cursor: "pointer",
        }}
      >
        Sign in with Google
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
