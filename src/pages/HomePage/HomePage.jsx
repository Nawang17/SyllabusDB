import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import "./HomePage.css";
import studentImage from "../../assets/studentshangingout-home.jpg";
import CountUp from "react-countup";
import { publicHomeColleges, searchHomeColleges, topHomeColleges } from "../../utils/homeColleges.js";

const CACHE_KEY = "homeColleges:v3";

export default function HomePage() {
  useEffect(() => {
    document.title = "SyllabusDB | Browse Past College Syllabi";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigate = useNavigate();

  const [searchIndex, setSearchIndex] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [indexLoadedOnce, setIndexLoadedOnce] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [totalUploads, setTotalUploads] = useState(null);
  const [animateCount, setAnimateCount] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loadError, setLoadError] = useState("");
  const requestRef = useRef(null);
  const topColleges = useMemo(() => topHomeColleges(searchIndex), [searchIndex]);
  const loadingTop = !indexLoadedOnce && !loadError;

  const fetchSearchIndex = useCallback(() => {
    if (requestRef.current) return requestRef.current;
    setLoadingIndex(true);
    setLoadError("");
    const request = (async () => {
      try {
        // Filter before ranking, including legacy public records without an
        // approved field. Search and rankings share this one collection read.
        const snapshot = await getDocs(collection(db, "colleges"));
        const data = publicHomeColleges(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
        setSearchIndex(data);
        setIndexLoadedOnce(true);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* Storage is optional. */ }
      } catch (error) {
        console.error("Error fetching colleges:", error);
        setLoadError("We couldn't load colleges. Please try again.");
      } finally {
        setLoadingIndex(false);
        requestRef.current = null;
      }
    })();
    requestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (Array.isArray(cached) && cached.every((item) => item && typeof item.id === "string" && typeof item.name === "string" && Array.isArray(item.aliases) && item.aliases.every((alias) => typeof alias === "string") && typeof item.nickname === "string" && Number.isFinite(item.uploads))) {
        setSearchIndex(cached);
        setIndexLoadedOnce(true);
      }
    } catch { /* Fetch fresh data when storage is unavailable or invalid. */ }
    void fetchSearchIndex();

    const unsubStats = onSnapshot(
      doc(db, "stats", "global"),
      (snap) => setTotalUploads(snap.data()?.total_syllabi || 0),
      (err) => { setTotalUploads(null); console.error("stats/global listener error:", err); },
    );

    const countEl = document.querySelector(".hero-syllabi-count");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let io;
    if (!reduce.matches && countEl) {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setAnimateCount(true);
            io.disconnect();
          }
        },
        { rootMargin: "120px" },
      );
      io.observe(countEl);
    }

    return () => {
      unsubStats();
      if (io) io.disconnect();
    };
  }, [fetchSearchIndex]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(
      () => setDebounced(searchQuery.trim().toLowerCase()),
      120,
    );
    return () => clearTimeout(t);
  }, [searchQuery]);

  const onSearchFocus = () => {
    setDropdownOpen(true);
    if (!indexLoadedOnce && !loadingIndex) void fetchSearchIndex();
  };

  const filtered = useMemo(() => searchHomeColleges(searchIndex, debounced), [searchIndex, debounced]);
  const activeResult = filtered[selectedIndex];
  const searchPending = searchQuery.trim().toLowerCase() !== debounced;

  useEffect(() => {
    if (dropdownOpen && activeResult && !searchPending) {
      document.getElementById(`college-option-${activeResult.id}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeResult, dropdownOpen, searchPending]);

  const goToCollege = (id) => {
    setDropdownOpen(false);
    setSelectedIndex(-1);
    navigate(`/college/${id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setDropdownOpen(false);
      setSelectedIndex(-1);
      return;
    }

    // Allow Enter even if dropdown is closed
    if (e.key === "Enter") {
      if (!debounced) return;
      if (!dropdownOpen) setDropdownOpen(true);

      e.preventDefault();
      const result = activeResult || filtered[0];
      if (result && !searchPending) goToCollege(result.id);
      return;
    }

    if (!dropdownOpen) return;
    if (!debounced || searchPending || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => prev <= 0 ? filtered.length - 1 : (prev - 1) % filtered.length,
      );
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (!dropdownOpen) return;
      const input = searchInputRef.current;
      const drop = dropdownRef.current;
      if (input && input.contains(e.target)) return;
      if (drop && drop.contains(e.target)) return;
      setDropdownOpen(false);
      setSelectedIndex(-1);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [dropdownOpen]);

  const highlightMatch = (name) => {
    if (!debounced) return name;
    const idx = name.toLowerCase().indexOf(debounced);
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark className="match">{name.slice(idx, idx + debounced.length)}</mark>
        {name.slice(idx + debounced.length)}
      </>
    );
  };

  return (
    <div className="home-page">
      <section className="search-section">
        <div className="hero-inner">
          <div className="headline">
            <h1>Know your class before you enroll.</h1>
            <p className="hero-subtext">
              Explore real syllabi shared by students.
            </p>
          </div>

          <p className="hero-syllabi-count" hidden={totalUploads === null}>
            <strong>
              {animateCount && totalUploads !== null ? (
                <CountUp
                  start={Math.max(
                    0,
                    totalUploads - Math.floor(totalUploads * 0.05),
                  )}
                  end={totalUploads}
                  duration={0.7}
                  separator=","
                />
              ) : (
                (totalUploads ?? 0).toLocaleString()
              )}
            </strong>{" "}
            syllabi available
          </p>

          <div className="hero-search-card">
            <div className="search-wrapper" onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDropdownOpen(false);
                setSelectedIndex(-1);
              }
            }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search for your college"
                value={searchQuery}
                onFocus={onSearchFocus}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(-1);
                  setDropdownOpen(true);
                }}
                onKeyDown={handleKeyDown}
                ref={searchInputRef}
                aria-label="Search for a college"
                aria-autocomplete="list"
                aria-expanded={dropdownOpen && !!searchQuery.trim()}
                aria-controls="college-search-listbox"
                aria-activedescendant={
                  dropdownOpen && activeResult && !searchPending
                    ? `college-option-${activeResult.id}`
                    : undefined
                }
                role="combobox"
                enterKeyHint="search"
                autoComplete="off"
              />

              {searchQuery && (
                <button
                  className="clear-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedIndex(-1);
                    setDropdownOpen(true);
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

              {dropdownOpen && searchQuery.trim() && (
                <div
                  className="results-box"
                  ref={dropdownRef}
                  role={filtered.length > 0 && !searchPending && !(loadError && !indexLoadedOnce) ? "listbox" : undefined}
                  id="college-search-listbox"
                >
                  {loadError && !indexLoadedOnce ? (
                    <div className="no-result" role="alert"><p>{loadError}</p><button className="home-retry" onClick={() => fetchSearchIndex()}>Try again</button></div>
                  ) : (loadingIndex && !indexLoadedOnce) || searchPending ? (
                    <div className="no-result" role="status">Loading colleges…</div>
                  ) : filtered.length > 0 ? (
                    filtered.map((college, index) => (
                      <button
                        type="button"
                        key={college.id}
                        id={`college-option-${college.id}`}
                        className={`result-item ${
                          selectedIndex === index ? "highlighted" : ""
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => goToCollege(college.id)}
                        role="option"
                        aria-selected={selectedIndex === index}
                      >
                        <span>{highlightMatch(college.name)}</span>
                        {[college.city, college.state].filter(Boolean).length > 0 && <small>{[college.city, college.state].filter(Boolean).join(", ")}</small>}
                      </button>
                    ))
                  ) : (
                    <div className="no-result">
                      <p className="no-result-title">No colleges found.</p>
                      <button
                        className="request-college-btn"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/requestcollege");
                        }}
                      >
                        Request a College
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="college-scroll-wrapper">
        <div className="scroll-header">
          <h2 className="scroll-title">Browse colleges</h2>
          <button className="scroll-cta" onClick={() => navigate("/colleges")}>
            View all
          </button>
        </div>

        {loadError && <div className="home-load-error" role="alert"><p>{loadError}{indexLoadedOnce ? " Showing previously loaded colleges." : ""}</p><button className="home-retry" disabled={loadingIndex} onClick={() => fetchSearchIndex()}>{loadingIndex ? "Retrying..." : "Try again"}</button></div>}
        {!loadingTop && !loadError && topColleges.length === 0 && <p className="home-empty">No colleges to browse yet. <button onClick={() => navigate("/requestcollege")}>Request your college</button></p>}
        <div className="top-colleges-list" aria-busy={loadingTop}>
          {loadingTop
            ? [...Array(3)].map((_, i) => (
                <div key={i} className="top-college-row skeleton">
                  <div className="rank-skeleton skeleton-line" />
                  <div className="college-info">
                    <div className="skeleton-line long" />
                    <div className="skeleton-line short" />
                  </div>
                  <div className="thumb-skeleton skeleton-img" />
                </div>
              ))
            : topColleges.slice(0, 3).map((college, i) => (
                <button
                  type="button"
                  key={college.id}
                  className="top-college-row fade-in"
                  onClick={() => navigate(`/college/${college.id}`)}
                >
                  <div className="college-rank">{i + 1}</div>

                  <div className="top-college-info">
                    <div className="top-college-name">{college.name}</div>
                    <div className="top-college-location">{[college.city, college.state].filter(Boolean).join(", ")}</div>
                    <div className="top-college-count">{college.uploads.toLocaleString()} {college.uploads === 1 ? "syllabus" : "syllabi"}</div>
                  </div>

                  <div className="top-college-thumb" aria-hidden="true">
                    <span>{college.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("")}</span>
                    {college.image_url && <img loading="lazy" decoding="async" src={college.image_url} alt="" width="64" height="64" onError={(event) => { event.currentTarget.hidden = true; }} />}
                  </div>
                </button>
              ))}
        </div>
      </section>

      <section
        className="why-section fade-in"
      >
        <img
          loading="lazy"
          decoding="async"
          width="720"
          height="450"
          src={studentImage}
          alt="Helping each other"
          className="why-img"
        />
        <div className="why-content">
          <h3>Help the next student.</h3>
          <p>
            Share a syllabus so others can plan their semester.
          </p>
          <button onClick={() => navigate("/uploadsyllabus")} className="btn">
            Upload a Syllabus
          </button>
          <p className="home-review-note">Uploads are reviewed before publishing.</p>
        </div>
      </section>

    </div>
  );
}
