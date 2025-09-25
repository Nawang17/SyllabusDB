import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import "./HomePage.css";
import studentImage from "../../assets/studentshangingout.jpg";
import verifiedImage from "../../assets/verified-illustration.jpg";
import CountUp from "react-countup";

const CACHE_KEY = "topColleges:v1";
const CACHE_TTL_MS = 60 * 1000; // 1 minute
function useOnScreen(ref, rootMargin = "200px") {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

export default function HomePage() {
  const [colleges, setColleges] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalUploads, setTotalUploads] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [animateCount, setAnimateCount] = useState(false);

  const searchInputRef = useRef(null);
  const scrollerRef = useRef(null);
  const scrollerIsNear = useOnScreen(scrollerRef);
  const navigate = useNavigate();

  const fetchTopColleges = async (toggleLoading = false) => {
    try {
      if (toggleLoading) setLoading(true);

      const q = query(
        collection(db, "colleges"),
        orderBy("approvedSyllabiTotal", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          name: x.name,
          image_url: x.image_url,
          uploads: x.approvedSyllabiTotal || 0,
        };
      });

      setColleges(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch (err) {
      console.error("Error fetching top colleges:", err);
    } finally {
      if (toggleLoading) setLoading(false);
    }
  };

  // SWR: show cache instantly, refresh in bg
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        const { data, ts } = JSON.parse(raw);
        if (Array.isArray(data)) {
          setColleges(data);
          setLoading(false);
        }
        if (!ts || Date.now() - ts > CACHE_TTL_MS) {
          void fetchTopColleges(true);
        }
      } catch {
        void fetchTopColleges(true);
      }
    } else {
      void fetchTopColleges(true);
    }

    // Live global total from stats/global
    const unsub = onSnapshot(
      doc(db, "stats", "global"),
      (snap) => setTotalUploads(snap.data()?.total_syllabi || 0),
      (err) => console.error("stats/global listener error:", err)
    );

    // Animate CountUp only when visible (and respect reduced motion)
    const countEl = document.querySelector(".hero-syllabi-count");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!reduce.matches && countEl) {
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setAnimateCount(true);
            io.disconnect();
          }
        },
        { rootMargin: "120px" }
      );
      io.observe(countEl);
      return () => {
        unsub();
        io.disconnect();
      };
    }
    return () => unsub();
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(
      () => setDebounced(searchQuery.trim().toLowerCase()),
      120
    );
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filtered = useMemo(() => {
    if (!debounced) return colleges;
    return colleges.filter((c) => c.name.toLowerCase().includes(debounced));
  }, [colleges, debounced]);

  const handleKeyDown = (e) => {
    if (debounced && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filtered.length) % filtered.length
        );
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        navigate(`/college/${filtered[selectedIndex].id}`);
      }
    }
  };

  const highlightMatch = (name) => {
    if (!debounced) return name;
    const index = name.toLowerCase().indexOf(debounced);
    if (index === -1) return name;
    return (
      <>
        {name.slice(0, index)}
        <strong>{name.slice(index, index + debounced.length)}</strong>
        {name.slice(index + debounced.length)}
      </>
    );
  };

  return (
    <div className="home-page">
      <section className="search-section">
        <div className="headline">
          <h1>Know the course</h1>
          <h1>before you enroll</h1>
        </div>

        <p className="hero-syllabi-count">
          <strong>
            {animateCount ? (
              <CountUp
                start={Math.max(
                  0,
                  totalUploads - Math.floor(totalUploads * 0.05)
                )}
                end={totalUploads}
                duration={0.7}
                separator=","
              />
            ) : (
              totalUploads.toLocaleString()
            )}
          </strong>{" "}
          syllabi available
        </p>

        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for your college..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            ref={searchInputRef}
            aria-label="Search for a college"
            enterKeyHint="search"
            autoComplete="off"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery("")}>
              ×
            </button>
          )}
          {searchQuery && (
            <div className="results-box">
              {filtered.length > 0 ? (
                filtered.map((college, index) => (
                  <div
                    key={college.id}
                    className={`result-item ${
                      selectedIndex === index ? "highlighted" : ""
                    }`}
                    onClick={() => navigate(`/college/${college.id}`)}
                  >
                    {highlightMatch(college.name)}
                  </div>
                ))
              ) : (
                <div className="no-result">
                  <p>No colleges found.</p>
                  <button
                    className="request-college-btn"
                    onClick={() => navigate("/requestcollege")}
                  >
                    Request a College
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Below-the-fold — let browser skip layout/paint until near */}
      <section
        ref={scrollerRef}
        className="college-scroll-wrapper"
        style={{ contentVisibility: "auto", containIntrinsicSize: "640px" }}
      >
        <h2 className="scroll-title">Most Shared Syllabi</h2>
        <div className="college-scroll">
          {loading || !scrollerIsNear
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="college-card skeleton">
                  <div className="skeleton-img" />
                  <div className="skeleton-line short" />
                  <div className="skeleton-line long" />
                </div>
              ))
            : filtered.map((college, i) => (
                <div
                  key={college.id}
                  className="college-card fade-in"
                  onClick={() => navigate(`/college/${college.id}`)}
                >
                  <img
                    loading="lazy"
                    src={college.image_url}
                    alt={college.name}
                    className="college-img"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/300x200?text=Image+Unavailable";
                    }}
                  />
                  <div className="college-name">
                    {i + 1}. {college.name}
                  </div>
                  {college.uploads > 0 && (
                    <div className="college-count">
                      {college.uploads} syllabi
                    </div>
                  )}
                </div>
              ))}
          {!loading && scrollerIsNear && (
            <div
              className="college-card view-all-card-link fade-in"
              onClick={() => navigate("/colleges")}
            >
              <span className="view-all-link">View All Colleges</span>
            </div>
          )}
        </div>
      </section>

      <section
        className="why-section fade-in"
        style={{ contentVisibility: "auto", containIntrinsicSize: "720px" }}
      >
        <img
          loading="lazy"
          src={studentImage}
          alt="Helping each other"
          className="why-img"
        />
        <div className="why-content">
          <h3>Why this matters</h3>
          <p>
            SyllabusDB helps students preview real course syllabi so they can
            choose classes with confidence. When you upload a syllabus, you’re
            supporting fellow students and building a more transparent, helpful
            campus culture.
          </p>
          <button onClick={() => navigate("/uploadsyllabus")} className="btn">
            Upload a Syllabus
          </button>
        </div>
      </section>

      <section
        className="trust-section fade-in"
        style={{ contentVisibility: "auto", containIntrinsicSize: "680px" }}
      >
        <div className="trust-content">
          <h3>Trusted & Verified</h3>
          <p>How we keep things safe and reliable:</p>
          <ul className="trust-list">
            <p>✔️ Every syllabus is manually reviewed before approval</p>
            <p>✔️ PDF uploads are scanned with antivirus tools</p>
            <p>✔️ Most uploads are approved within 12 hours</p>
          </ul>
          <p>
            SyllabusDB is dedicated to maintaining a safe and reliable platform
            for all users.
          </p>
        </div>
        <img
          loading="lazy"
          src={verifiedImage}
          alt="Verified submission process"
          className="trust-image"
        />
      </section>
    </div>
  );
}
