import { useState } from "react";
import "./HomePage.css";
import { useNavigate } from "react-router";

const dummyColleges = [
  {
    id: "hunter",
    name: "Hunter College",
    image:
      "https://s29068.pcdn.co/wp-content/uploads/campus-shot-768x432.jpg.optimal.jpg",
    uploads: 421,
  },
  {
    id: "baruch",
    name: "Baruch College",
    image:
      "https://enrollmentmanagement.baruch.cuny.edu/wp-content/uploads/sites/18/2020/07/VerticalCampus2_002.jpg",
    uploads: 392,
  },
  {
    id: "city",
    name: "City College",
    image:
      "https://harlemonestop.com/images/organizations/1542.jpg?v=1587326290",
    uploads: 281,
  },
  {
    id: "brooklyn",
    name: "Brooklyn College",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/2016_Brooklyn_College_Library.jpg/250px-2016_Brooklyn_College_Library.jpg",
    uploads: 210,
  },
  {
    id: "queens",
    name: "Queens College",
    image:
      "https://macaulay.cuny.edu/wp-content/uploads/2016/07/qc10_bg_000056-1920x1080.jpg",
    uploads: 198,
  },
  {
    id: "lehman",
    name: "Lehman College",
    image:
      "https://www.lehman.cuny.edu/media/Lehman-College-Website/Content-Assets-2024/Images/About.jpg",
    uploads: 174,
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = dummyColleges.filter((college) =>
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
                  <div key={college.id} className="collegeResult">
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
          {dummyColleges
            .sort((a, b) => b.uploads - a.uploads)
            .map((college) => (
              <div
                key={college.id}
                className="collegeCard"
                onClick={() => navigate(`/college/${college.id}`)}
              >
                <img
                  src={college.image}
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
