import { useState } from "react";
import "./CollegePage.css";
import { useNavigate, useParams } from "react-router";
const collegeData = {
  hunter: { name: "Hunter College" },
  baruch: { name: "Baruch College" },
  city: { name: "City College" },
};
const dummyCourses = [
  {
    code: "CSCI 135",
    title: "Software Design & Analysis I",
    syllabi: [
      {
        id: 1,
        professor: "Prof. Adams",
        semester: "Fall 2024",
        url: "/syllabi/csci135-fall2024-adams.pdf",
      },
      {
        id: 2,
        professor: "Dr. Smith",
        semester: "Spring 2023",
        url: "/syllabi/csci135-spring2023-smith.pdf",
      },
    ],
  },
  {
    code: "MATH 241",
    title: "Linear Algebra",
    syllabi: [
      {
        id: 3,
        professor: "Dr. Patel",
        semester: "Spring 2024",
        url: "/syllabi/math241-spring2024-patel.pdf",
      },
    ],
  },
  {
    code: "ENG 101",
    title: "English Composition",
    syllabi: [
      {
        id: 4,
        professor: "Prof. Lee",
        semester: "Fall 2023",
        url: "/syllabi/eng101-fall2023-lee.pdf",
      },
    ],
  },
];

export default function CollegePage() {
  const { collegeId } = useParams();
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const navigate = useNavigate();
  const toggleExpand = (code) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const filteredCourses = dummyCourses
    .filter(
      (c) =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "code") return a.code.localeCompare(b.code);
      if (sort === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  const college = collegeData[collegeId];

  if (!college) return <div className="not-found">College not found.</div>;
  return (
    <div className="college-page">
      <div className="college-title">{college.name}</div>
      <div className="college-subtitle">Search for syllabi</div>

      <div className="search-and-controls">
        <input
          type="text"
          className="syllabus-search"
          placeholder="Search course by code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="filters">
          <select
            className="filter-dropdown"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">Sort by</option>
            <option value="code">Course Code</option>
            <option value="title">Course Title</option>
          </select>

          <select className="filter-dropdown">
            <option value="all">Filter Semester</option>
            <option value="spring">Spring</option>
            <option value="fall">Fall</option>
            <option value="summer">Summer</option>
          </select>
        </div>
      </div>
      {filteredCourses.length === 0 && (
        <div className="no-courses-found">
          <p>We couldn’t find that course.</p>
          <button onClick={() => navigate("/upload")}>Upload Syllabus</button>
          <button onClick={() => navigate("/request")}>Request Course</button>
        </div>
      )}

      <div className="course-list">
        {filteredCourses.map((course) => (
          <div className="course-card" key={course.code}>
            <div
              className="course-header"
              onClick={() => toggleExpand(course.code)}
            >
              <div>
                <div className="course-code">{course.code}</div>
                <div className="course-title">{course.title}</div>
              </div>
              <div className="expand-icon">
                {expanded[course.code] ? "▼" : "▶"}
              </div>
            </div>

            {expanded[course.code] && (
              <div className="syllabi-list">
                {course.syllabi.map((s) => (
                  <div key={s.id} className="syllabus-item">
                    <div>
                      {s.semester} – {s.professor}
                    </div>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      View PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
