import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { db } from "../../../firebaseConfig";
import "./RequestCollege.css";

export default function RequestCollege() {
  const [collegeName, setCollegeName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const generateDocId = (name) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  useEffect(() => {
    document.title = "SyllabusDB | Request a College";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanCollegeName = collegeName.trim();
    const cleanCity = city.trim();
    const cleanState = state.trim();

    if (!cleanCollegeName || !cleanCity || !cleanState) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const auth = getAuth();
      let user = auth.currentUser;

      if (!user) {
        const result = await signInAnonymously(auth);
        user = result.user;
      }

      const id = generateDocId(cleanCollegeName);
      const collegeRef = doc(db, "colleges", id);
      const existingDoc = await getDoc(collegeRef);

      if (existingDoc.exists()) {
        setError("This college already exists or has already been requested.");
        return;
      }

      await setDoc(collegeRef, {
        name: cleanCollegeName,
        city: cleanCity,
        state: cleanState,
        approved: false,
        createdAt: serverTimestamp(),
        approvedSyllabiTotal: 0,
        image_url: null,
        owner: user?.uid || null,
      });

      await fetch(
        "https://syllabusdbserver-agza.onrender.com/notify-college-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collegeName: cleanCollegeName,
            location: `${cleanCity}, ${cleanState}`,
          }),
        },
      );

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting college request:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="request-college-page">
      <section className="request-card">
        {!submitted ? (
          <>
            <div className="request-header">
              <h1>Request a College</h1>
              <p>
                Can’t find your college? Send a request and we’ll review it
                before adding it to SyllabusDB.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="request-form">
              {error && <p className="error-message">{error}</p>}

              <div className="form-field">
                <label htmlFor="collegeName">
                  College Name <span>*</span>
                </label>
                <input
                  id="collegeName"
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g., Boston University"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="city">
                    City <span>*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Boston"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="state">
                    State <span>*</span>
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g., Massachusetts"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>Request submitted</h1>
            <p>Thanks. We’ll review your college request soon.</p>

            <div className="success-actions">
              <button onClick={() => navigate("/colleges")}>
                Browse Colleges
              </button>
              <button className="secondary-btn" onClick={() => navigate("/")}>
                Back Home
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
