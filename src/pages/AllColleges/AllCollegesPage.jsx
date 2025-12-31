import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useNavigate } from "react-router";
import "./AllCollegesPage.css";

export default function AllCollegesPage() {
  const [collegesByState, setCollegesByState] = useState({});
  const [totalColleges, setTotalColleges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "SyllabusDB | All Colleges";

    const fetchColleges = async () => {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "colleges"));
      const grouped = {};
      let approvedCount = 0;

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.approved === false) return;

        const state = (data.state || "Unknown").trim() || "Unknown";
        if (!grouped[state]) grouped[state] = [];

        grouped[state].push({
          id: docSnap.id,
          name: (data.name || "(Untitled)").trim() || "(Untitled)",
        });

        approvedCount += 1;
      });

      // Sort states + colleges
      const sorted = {};
      Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .forEach((state) => {
          sorted[state] = grouped[state].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        });

      setCollegesByState(sorted);
      setTotalColleges(approvedCount);
      setLoading(false);
      window.scrollTo(0, 0);
    };

    fetchColleges();
  }, []);

  const filteredByState = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return collegesByState;

    const out = {};
    Object.keys(collegesByState).forEach((state) => {
      const stateMatch = state.toLowerCase().includes(needle);
      const colleges = collegesByState[state].filter((c) =>
        c.name.toLowerCase().includes(needle)
      );

      // If state name matches, include all colleges in that state
      if (stateMatch) out[state] = collegesByState[state];
      else if (colleges.length > 0) out[state] = colleges;
    });

    return out;
  }, [q, collegesByState]);

  const stateKeys = useMemo(
    () => Object.keys(filteredByState),
    [filteredByState]
  );

  return (
    <div className="all-colleges-page">
      <div className="acp-header">
        <h1 className="page-title">
          {loading ? "Loading…" : `${totalColleges} Colleges`}
        </h1>

        <div className="acp-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="acp-search-input"
            placeholder="Search state or college…"
            aria-label="Search state or college"
          />
          {q && (
            <button
              className="acp-clear"
              onClick={() => setQ("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ padding: 12 }}>Loading colleges…</p>
      ) : stateKeys.length === 0 ? (
        <div className="acp-empty">
          <p>No results.</p>
          <button
            className="request-college-btn"
            onClick={() => navigate("/requestcollege")}
          >
            Request a College
          </button>
        </div>
      ) : (
        <div className="acp-simple-list">
          {stateKeys.map((state) => (
            <section key={state} className="state-section">
              <h2 className="state-title">
                {state}{" "}
                <span className="state-count">
                  ({filteredByState[state].length})
                </span>
              </h2>

              <ul className="college-list">
                {filteredByState[state].map((college) => (
                  <li key={college.id}>
                    <button
                      className="college-link"
                      onClick={() => navigate(`/college/${college.id}`)}
                    >
                      {college.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {!loading && (
        <div className="request-college-cta">
          <p>Don’t see your college listed?</p>
          <button onClick={() => navigate("/requestcollege")}>
            Request a College
          </button>
        </div>
      )}
    </div>
  );
}
