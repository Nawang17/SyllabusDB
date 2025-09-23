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
        let uploadsSum = 0;
        const collegesData = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const uploads = data.approvedSyllabiTotal || 0;

            return {
              id: doc.id,
              name: data.name,
              image_url: data.image_url,
              uploads,
              approved: data.approved, // include this so we can filter
            };
          })
          .filter((college) => college.approved !== false); // only include approved or undefined

        uploadsSum = collegesData.reduce((sum, c) => sum + c.uploads, 0);

        setColleges(collegesData);
        setTotalUploads(uploadsSum);
      } catch (error) {
        console.error("Error fetching colleges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollegesWithCounts();
  }, []);

  const filtered = colleges.filter((college) =>
    college.name.toLowerCase().includes(Searchquery.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (Searchquery && filtered.length > 0) {
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
    const index = name.toLowerCase().indexOf(Searchquery.toLowerCase());
    if (index === -1) return name;
    return (
      <>
        {name.slice(0, index)}
        <strong>{name.slice(index, index + Searchquery.length)}</strong>
        {name.slice(index + Searchquery.length)}
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
            <CountUp start={0} end={totalUploads} duration={2} separator="," />
          </strong>{" "}
          syllabi available
        </p>

        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for your college..."
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
            <button className="clear-btn" onClick={() => setSearchQuery("")}>
              ×
            </button>
          )}
          {Searchquery && (
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
                .map((college, i) => (
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
                      onError={(e) =>
                        (e.target.src =
                          "https://via.placeholder.com/300x200?text=Image+Unavailable")
                      }
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
            supporting fellow students and building a more transparent, helpful
            campus culture.
          </p>
          <button onClick={() => navigate("/uploadsyllabus")} className="btn">
            Upload a Syllabus
          </button>
        </div>
      </section>

      <section className="trust-section fade-in">
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
