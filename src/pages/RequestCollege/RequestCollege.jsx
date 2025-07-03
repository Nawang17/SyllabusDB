import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import "./RequestCollege.css";

export default function RequestCollege() {
  const [collegeName, setCollegeName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const generateDocId = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!collegeName.trim() || !city.trim() || !state.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    const id = generateDocId(collegeName);

    try {
      const collegeRef = doc(db, "colleges", id);
      const existingDoc = await getDoc(collegeRef);

      if (existingDoc.exists()) {
        setError(
          "A college with this name already exists or has been requested."
        );
        return;
      }

      await setDoc(collegeRef, {
        name: collegeName.trim(),
        city: city.trim(),
        state: state.trim(),
        approved: false,

        createdAt: serverTimestamp(),
        approvedSyllabiTotal: 0,
        image_url: null,
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting college request:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="request-college-page">
      <h1>📩 Request a College</h1>
      <p>
        If you can't find your college, you can request that we add it here.
      </p>

      {submitted ? (
        <div className="success-message">
          <p>✅ Thank you! We'll review your request soon.</p>
          <button onClick={() => navigate("/")}>Back to Home</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="request-form">
          {error && <p className="error-message">{error}</p>}

          <label>
            College Name<span className="required">*</span>
          </label>
          <input
            type="text"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            placeholder="e.g., Boston University"
            required
          />

          <label>
            City<span className="required">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Boston"
            required
          />

          <label>
            State<span className="required">*</span>
          </label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g., Massachusetts"
            required
          />

          <button type="submit" className="submit-btn">
            Submit Request
          </button>
        </form>
      )}
    </div>
  );
}
