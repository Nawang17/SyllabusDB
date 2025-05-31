import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig"; // adjust the path if needed
import "./HomePage.css";

export default function HomePage() {
  const [colleges, setColleges] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
      const snapshot = await getDocs(collection(db, "colleges"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setColleges(data);
    };

    fetchColleges();
  }, []);

  const filtered = colleges.filter((college) =>
    college.name.toLowerCase().includes(query.toLowerCase())
  );

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
          {colleges
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
                <div className="collegeCount">{college.uploads} syllabi</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
