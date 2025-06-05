// HomePage.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import "./HomePage.css";
import studentImage from "../../assets/studentshangingout.jpg";
import verifiedImage from "../../assets/verified-illustration.jpg"; // Adjust the path as needed
export default function HomePage() {
  const [colleges, setColleges] = useState([]);
  const [Searchquery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchCollegesWithCounts = async () => {
      // Fetch all colleges from the top-level "colleges" collection
      const collegesSnapshot = await getDocs(collection(db, "colleges"));

      // For each college, get its approved courses and approved syllabi count
      const collegesData = await Promise.all(
        collegesSnapshot.docs.map(async (collegeDoc) => {
          const collegeId = collegeDoc.id;

          // Query only approved courses within the current college
          const coursesQuery = query(
            collection(db, "colleges", collegeId, "courses"),
            where("approved", "==", true)
          );
          const coursesSnapshot = await getDocs(coursesQuery);

          let totalApproved = 0;

          // For each approved course, query only approved syllabi
          for (const courseDoc of coursesSnapshot.docs) {
            totalApproved += courseDoc.data().approvedSyllabiCount || 0;
          }

          // Return college data with total approved uploads
          return {
            id: collegeId,
            name: collegeDoc.data().name,
            image_url: collegeDoc.data().image_url,
            uploads: totalApproved,
          };
        })
      );

      // Update state with colleges and their respective uploads
      setColleges(collegesData);
      setLoading(false);
    };

    // Call the data-fetching function on component mount
    fetchCollegesWithCounts();

    // Scroll to top on initial load
    window.scrollTo(0, 0);
  }, []);

  const filtered = colleges.filter((college) =>
    college.name.toLowerCase().includes(Searchquery.toLowerCase())
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
            value={Searchquery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {Searchquery && (
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
          {!loading && (
            <div
              className="college-card view-all-card-link"
              onClick={() => navigate("/colleges")}
            >
              <span className="view-all-link">View All Colleges</span>
            </div>
          )}
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
      <section className="trust-section">
        <div className="trust-content">
          <h3>Trusted & Verified</h3>
          <p>How we keep things safe and reliable:</p>
          <ul className="trust-list">
            <li>✅ Every syllabus is reviewed before approval</li>
            <li>🛡️ PDF uploads are scanned with antivirus tools</li>
            <li>📅 Most uploads are approved within 24 hours</li>
          </ul>
          <p>
            We’re committed to creating a trusted, helpful resource for all
            students.
          </p>
        </div>
        <img
          src={verifiedImage}
          alt="Verified submission process"
          className="trust-image"
        />
      </section>
    </div>
  );
}
