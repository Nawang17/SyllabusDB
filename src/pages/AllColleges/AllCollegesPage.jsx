import { useEffect, useMemo, useRef, useState } from "react";
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
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchColleges = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "colleges"));
      const grouped = {};
      let approvedCount = 0;

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.approved === false) return;
        const state = data.state || "Unknown";
        if (!grouped[state]) grouped[state] = [];
        grouped[state].push({
          id: docSnap.id,
          name: data.name || "(Untitled)",
        });
        approvedCount += 1;
      });

      // sort
      const sortedStates = Object.keys(grouped).sort((a, b) =>
        a.localeCompare(b)
      );
      const sortedGrouped = {};
      sortedStates.forEach((s) => {
        sortedGrouped[s] = grouped[s].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

      setCollegesByState(sortedGrouped);
      setTotalColleges(approvedCount);
      setLoading(false);
      window.scrollTo(0, 0);
    };

    fetchColleges();
  }, []);

  const filteredStateKeys = useMemo(() => {
    if (!q.trim()) return Object.keys(collegesByState);
    const needle = q.toLowerCase();
    return Object.keys(collegesByState).filter((state) => {
      const inStateName = state.toLowerCase().includes(needle);
      const anyCollege = collegesByState[state].some((c) =>
        c.name.toLowerCase().includes(needle)
      );
      return inStateName || anyCollege;
    });
  }, [q, collegesByState]);

  const filteredByState = useMemo(() => {
    if (!q.trim()) return collegesByState;
    const needle = q.toLowerCase();
    const out = {};
    filteredStateKeys.forEach((state) => {
      out[state] = collegesByState[state].filter(
        (c) =>
          state.toLowerCase().includes(needle) ||
          c.name.toLowerCase().includes(needle)
      );
    });
    return out;
  }, [q, collegesByState, filteredStateKeys]);

  const letters = useMemo(() => {
    // Letters present across state names
    const set = new Set(
      filteredStateKeys
        .map((s) => (s[0] || "#").toUpperCase())
        .filter((ch) => /[A-Z]/.test(ch))
    );
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((L) => set.has(L));
  }, [filteredStateKeys]);

  const scrollToState = (state) => {
    const el = document.getElementById(`state-${state}`);
    if (!el) return;

    const headerHeight = 80; // tweak for your header size
    const rect = el.getBoundingClientRect();
    const offsetTop = window.scrollY + rect.top - headerHeight;

    window.scrollTo({
      top: offsetTop,
      behavior: "smooth",
    });
  };

  return (
    <div className="all-colleges-page">
      <div className="acp-header">
        <div>
          <h1 className="page-title">
            {loading
              ? "Loading Colleges…"
              : `${totalColleges} Colleges on SyllabusDB`}
          </h1>
          <p className="college-count">
            Browse by state or search by college/state name.
          </p>
        </div>

        <div className="acp-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="acp-search-input"
            placeholder="Search colleges or states…"
            aria-label="Search colleges or states"
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

      {/* A–Z jump bar */}
      {!loading && letters.length > 0 && (
        <div className="acp-alpha">
          {letters.map((L) => (
            <button
              key={L}
              className="acp-alpha-btn"
              onClick={() => {
                // find first state starting with L
                const s = filteredStateKeys.find((st) =>
                  st.toUpperCase().startsWith(L)
                );
                if (s) scrollToState(s);
              }}
              aria-label={`Jump to states starting with ${L}`}
            >
              {L}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="acp-content" ref={containerRef}>
        {loading ? (
          <div className="acp-skeleton">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="state-group">
                <div className="sk-title" />
                <div className="acp-grid">
                  {[...Array(8)].map((_, j) => (
                    <div key={j} className="sk-chip" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredStateKeys.length === 0 ? (
          <div className="acp-empty">
            <p>No results. Try a different term.</p>
            <button
              className="request-college-btn"
              onClick={() => navigate("/requestcollege")}
            >
              Request a College
            </button>
          </div>
        ) : (
          filteredStateKeys.map((state) => (
            <div key={state} className="state-group" id={`state-${state}`}>
              <div className="state-title-row">
                <h2 className="state-title">
                  {state}
                  <span className="state-count">
                    {filteredByState[state].length}
                  </span>
                </h2>
                <button
                  className="state-top"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  Back to top
                </button>
              </div>

              <div className="acp-grid">
                {filteredByState[state].map((college) => (
                  <button
                    key={college.id}
                    className="college-chip"
                    onClick={() => navigate(`/college/${college.id}`)}
                    title={college.name}
                  >
                    {college.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

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
