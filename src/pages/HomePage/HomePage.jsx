import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig"; // adjust the path if needed
import "./HomePage.css";

export default function HomePage() {
  const [colleges, setColleges] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
          syllabiSnapshot.forEach((syllabus) => {
            if (syllabus.data().approved === true) {
              totalApproved += 1;
            }
          });
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
  useEffect(() => {
    fetchCollegesWithCounts();
  }, []);

  const filtered = colleges.filter((college) =>
    college.name.toLowerCase().includes(query.toLowerCase())
  );
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="home-page">
      <div className="searchSection">
        <div>
          <div className="searchTitle">Know the course </div>
          <div className="searchTitle">before you enroll</div>
        </div>

        <div className="searchWrapper">
          <input
            type="text"
            className="customSearchInput"
            placeholder="Search for your college..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <div className="resultsBox">
              {filtered.length > 0 ? (
                filtered.map((college) => (
                  <div
                    key={college.id}
                    onClick={() => navigate(`/college/${college.id}`)}
                    className="collegeResult"
                  >
                    {college.name}
                  </div>
                ))
              ) : (
                <div className="noResult">No colleges found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="collegeScrollWrapper">
        <div className="scrollTitle">Colleges</div>
        <div className="collegeScroll">
          {loading
            ? [...Array(3)].map((_, i) => (
                <div key={i} className="collegeCard skeletonCard">
                  <div className="skeletonImage" />
                  <div className="skeletonText short" />
                  <div className="skeletonText long" />
                </div>
              ))
            : colleges
                .sort((a, b) => b.uploads - a.uploads)
                .map((college) => (
                  <div
                    key={college.id}
                    className="collegeCard"
                    onClick={() => navigate(`/college/${college.id}`)}
                  >
                    <img
                      src={college.image_url}
                      alt={college.name}
                      className="collegeImage"
                    />
                    <div className="collegeName">{college.name}</div>
                    {college.uploads > 0 && (
                      <div className="collegeCount">
                        {college.uploads} syllabi
                      </div>
                    )}
                  </div>
                ))}
        </div>
      </div>
    </div>
  );
}
