import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import "./HomePage.css";
import studentImage from "../../assets/studentshangingout.jpg";
import verifiedImage from "../../assets/verified-illustration.jpg";
import CountUp from "react-countup";

export default function HomePage() {
  const [colleges, setColleges] = useState([]);
  const [Searchquery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalUploads, setTotalUploads] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchCollegesWithCounts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "colleges"));
        const collegesData = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              image_url: data.image_url,
              uploads: data.approvedSyllabiTotal || 0,
              approved: data.approved,
            };
          })
          .filter((c) => c.approved !== false);

        setColleges(collegesData);
        setTotalUploads(collegesData.reduce((sum, c) => sum + c.uploads, 0));
      } catch (error) {
        console.error("Error fetching colleges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollegesWithCounts();
  }, []);

  const filtered = colleges.filter((college) =>
    college.name?.toLowerCase().includes(Searchquery.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (!Searchquery || filtered.length === 0) return;

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
  };

  const highlightMatch = (name = "") => {
    const idx = name.toLowerCase().indexOf(Searchquery.toLowerCase());
    if (idx === -1 || !Searchquery) return name;
    return (
      <>
        {name.slice(0, idx)}
        <strong>{name.slice(idx, idx + Searchquery.length)}</strong>
        {name.slice(idx + Searchquery.length)}
      </>
    );
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="search-section">
        <div className="headline">
          <h1>Know the course</h1>
          <h1>before you enroll</h1>
        </div>

        <p className="hero-syllabi-count">
          <strong>
            <CountUp
              start={0}
              end={totalUploads}
              duration={1.5}
              separator=","
            />
          </strong>{" "}
          syllabi available
        </p>

        {/* Floating search card */}
        <div className="search-wrapper" role="search">
          <input
            type="text"
            className="search-input"
            placeholder="Search for your college"
            value={Searchquery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            ref={searchInputRef}
            aria-label="Search for a college"
          />
          {Searchquery && (
            <button
              className="clear-btn"
              onClick={() => {
                setSearchQuery("");
                setSelectedIndex(-1);
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

          {Searchquery && (
            <div className="results-box" role="listbox">
              {filtered.length > 0 ? (
                <>
                  <div className="results-meta">
                    {filtered.length} match{filtered.length > 1 ? "es" : ""}
                  </div>
                  {filtered.slice(0, 8).map((college, index) => (
                    <div
                      key={college.id}
                      role="option"
                      aria-selected={selectedIndex === index}
                      className={`result-item ${
                        selectedIndex === index ? "highlighted" : ""
                      }`}
                      onClick={() => navigate(`/college/${college.id}`)}
                    >
                      {highlightMatch(college.name)}
                    </div>
                  ))}
                  {filtered.length > 8 && (
                    <div className="results-more">Keep typing to narrow</div>
                  )}
                </>
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

      {/* Most Shared */}
      <section className="college-scroll-wrapper">
        <h2 className="scroll-title">Most Shared Syllabi</h2>
        <div className="college-scroll">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="college-card skeleton">
                  <div className="skeleton-img" />
                  <div className="skeleton-line short" />
                  <div className="skeleton-line long" />
                </div>
              ))
            : colleges
                .sort((a, b) => b.uploads - a.uploads)
                .slice(0, 10)
                .map((college) => (
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
                    <div className="college-name">{college.name}</div>

                    {college.uploads > 0 && (
                      <div className="college-count">
                        {college.uploads} syllabi
                      </div>
                    )}
                  </div>
                ))}
          {!loading && (
            <div
              className="college-card view-all-card-link fade-in"
              onClick={() => navigate("/colleges")}
            >
              <span className="view-all-link">View All Colleges</span>
            </div>
          )}
        </div>
      </section>

      {/* Why */}
      <section className="why-section fade-in">
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
            supporting fellow students and building a more transparent campus
            culture.
          </p>
          <button onClick={() => navigate("/uploadsyllabus")} className="btn">
            Upload a Syllabus
          </button>
        </div>
      </section>

      {/* Trust */}
      <section className="trust-section fade-in">
        <div className="trust-content">
          <h3>Trusted and Verified</h3>
          <p>How we keep things safe and reliable:</p>
          <ul className="trust-list">
            <li>Every syllabus is reviewed before approval</li>
            <li>PDF uploads are scanned with antivirus tools</li>
            <li>Most uploads are approved within 24 hours</li>
          </ul>
          <p>
            We’re committed to creating a trusted, helpful resource for all
            students.
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
