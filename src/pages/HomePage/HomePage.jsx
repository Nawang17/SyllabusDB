// HomePage.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import "./HomePage.css";
import studentImage from "../../assets/studentshangingout.jpg";
export default function HomePage() {
  const [colleges, setColleges] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCollegesWithCounts = async () => {
      const collegesSnapshot = await getDocs(collection(db, "colleges"));
      const collegesData = await Promise.all(
        collegesSnapshot.docs.map(async (collegeDoc) => {
          const collegeId = collegeDoc.id;
          const coursesSnapshot = await getDocs(
            collection(db, "colleges", collegeId, "courses")
          );

          let totalApproved = 0;
          for (const courseDoc of coursesSnapshot.docs) {
            const syllabiSnapshot = await getDocs(
              collection(
                db,
                "colleges",
                collegeId,
                "courses",
                courseDoc.id,
                "syllabi"
              )
            );
            totalApproved += syllabiSnapshot.docs.filter(
              (doc) => doc.data().approved
            ).length;
          }

          return {
            id: collegeId,
            name: collegeDoc.data().name,
            image_url: collegeDoc.data().image_url,
            uploads: totalApproved,
          };
        })
      );

      setColleges(collegesData);
      setLoading(false);
    };

    fetchCollegesWithCounts();
    window.scrollTo(0, 0);
  }, []);

  const filtered = colleges.filter((college) =>
    college.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="home-page">
      <section className="search-section">
        <div className="headline">
          <h1>Know the course</h1>
          <h1>before you enroll</h1>
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for your college..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {query && (
            <div className="results-box">
              {filtered.length > 0 ? (
                filtered.map((college) => (
                  <div
                    key={college.id}
                    className="result-item"
                    onClick={() => navigate(`/college/${college.id}`)}
                  >
                    {college.name}
                  </div>
                ))
              ) : (
                <div className="no-result">No colleges found.</div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="college-scroll-wrapper">
        <h2 className="scroll-title">Explore Colleges</h2>
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
                .map((college) => (
                  <div
                    key={college.id}
                    className="college-card"
                    onClick={() => navigate(`/college/${college.id}`)}
                  >
                    <img
                      src={college.image_url}
                      alt={college.name}
                      className="college-img"
                    />
                    <div className="college-name">{college.name}</div>
                    {college.uploads > 0 && (
                      <div className="college-count">
                        {college.uploads} syllabi
                      </div>
                    )}
                  </div>
                ))}
        </div>
      </section>
      <section className="why-section">
        <img src={studentImage} alt="Helping each other" className="why-img" />
        <div className="why-content">
          <h3>Why this matters</h3>
          <p>
            SyllabusDB helps students preview real course syllabi so they can
            choose classes with confidence. When you upload a syllabus, you’re
            supporting fellow students and building a more transparent, helpful
            campus culture.
          </p>
          <button
            onClick={() => navigate("/uploadsyllabus")}
            className="upload-cta-btn"
          >
            Upload a Syllabus
          </button>
        </div>
      </section>
    </div>
  );
}
