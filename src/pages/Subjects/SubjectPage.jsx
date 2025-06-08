// SubjectPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { db } from "../../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@mantine/core";
import "./SubjectPage.css";
import { useLocation } from "react-router";

export default function SubjectPage() {
  const { collegeId, subject } = useParams();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [syllabiMap, setSyllabiMap] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCourseId, setLoadingCourseId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [totalSyllabiCount, setTotalSyllabiCount] = useState(0);
  const [collegeNickname, setCollegeNickname] = useState("");
  // Helper to read query params
  function useQuery() {
    return new URLSearchParams(useLocation().search);
  }

  const URLquery = useQuery();
  const searchAppliedRef = useRef(false);

  useEffect(() => {
    if (searchAppliedRef.current) return;

    const courseQuery = URLquery.get("course");
    if (!courseQuery) return;

    // Wait until courses are loaded
    if (courses.length > 0) {
      setSearch(courseQuery);
      searchAppliedRef.current = true;

      const matched = courses.find(
        (c) => c.code.toLowerCase().trim() === courseQuery.toLowerCase().trim()
      );
      if (matched) {
        toggleExpand(matched.id);
      }
    }
  }, [courses]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    scrollToTop();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigate = useNavigate();

  const termOrder = {
    Spring: 1,
    Summer: 2,
    Fall: 3,
    Winter: 4,
  };
  const formatCollegeName = (str) => {
    return str
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const courseQuery = query(
          collection(db, "colleges", collegeId, "courses"),
          where("approved", "==", true)
        );
        const snapshot = await getDocs(courseQuery);
        const allCourses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filtered = allCourses.filter(
          (course) =>
            course.code &&
            course.code.toUpperCase().startsWith(subject?.toUpperCase() + " ")
        );

        const total = filtered.reduce(
          (sum, course) => sum + (course.approvedSyllabiCount || 0),
          0
        );

        setCourses(filtered);
        setFilteredCourses(filtered);
        setTotalSyllabiCount(total);
      } catch (err) {
        console.error("Failed to fetch subject courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [collegeId, subject]);
  useEffect(() => {
    const fetchCollegeNickname = async () => {
      try {
        const collegeDocRef = doc(db, "colleges", collegeId);
        const collegeDocSnap = await getDoc(collegeDocRef);

        if (collegeDocSnap.exists()) {
          const data = collegeDocSnap.data();
          setCollegeNickname(data.nickname || "");
        }
      } catch (err) {
        console.error("Failed to fetch college nickname:", err);
      }
    };

    fetchCollegeNickname();
  }, [collegeId]);

  useEffect(() => {
    setFilteredCourses(
      courses.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.title.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, courses]);

  const toggleExpand = async (courseId) => {
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }));

    if (!syllabiMap[courseId]) {
      setLoadingCourseId(courseId);
      try {
        const syllabiQuery = query(
          collection(db, "colleges", collegeId, "courses", courseId, "syllabi"),
          where("approved", "==", true)
        );
        const snapshot = await getDocs(syllabiQuery);
        const syllabi = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        syllabi.sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return termOrder[b.term] - termOrder[a.term];
        });

        setSyllabiMap((prev) => ({ ...prev, [courseId]: syllabi }));
      } catch (err) {
        console.error("Error fetching syllabi:", err);
      } finally {
        setLoadingCourseId(null);
      }
    }
  };

  return (
    <div className="college-page">
      <div className="college-header">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="college-title">
            <strong>{subject?.toUpperCase()}</strong> syllabi
          </div>
          <div
            onClick={() => navigate(`/college/${collegeId}`)}
            style={{ fontSize: "0.9rem", fontWeight: "500", cursor: "pointer" }}
          >
            {formatCollegeName(collegeId)}
          </div>
        </div>
      </div>

      <div className="breadcrumb-nav">
        <Link to={`/`} className="breadcrumb-link breadcrumb-home">
          Home
        </Link>
        <IconChevronRight className="breadcrumb-home" size={16} />
        <Link to={`/college/${collegeId}`} className="breadcrumb-link">
          {collegeNickname || formatCollegeName(collegeId)}
        </Link>
        <IconChevronRight size={16} />
        <div className="breadcrumb-current">{subject?.toUpperCase()}</div>
      </div>
      {!loading && (
        <>
          <div style={{ fontSize: "1.2rem", fontWeight: "500" }}>
            <span style={{ fontWeight: "bold", color: "#007bff" }}>
              {totalSyllabiCount}
            </span>{" "}
            course syllabi available
          </div>

          <div className="search-and-controls">
            <input
              id="course-search"
              type="text"
              className="syllabus-search"
              placeholder="Search by course code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="no-courses-found">
          <p>No courses found for this search</p>
        </div>
      ) : (
        <div className="course-list">
          {filteredCourses.map((course) => (
            <div className="course-card" key={course.id}>
              <div
                className="course-header"
                onClick={() => toggleExpand(course.id)}
              >
                <div>
                  <div className="course-code">{course.code}</div>
                  <div className="course-title">{course.title}</div>
                </div>
                <div className="expand-icon">
                  {expanded[course.id] ? (
                    <IconChevronDown />
                  ) : (
                    <IconChevronRight />
                  )}
                </div>
              </div>

              {expanded[course.id] && (
                <div className="syllabi-list">
                  {loadingCourseId === course.id ? (
                    <div className="loading-syllabi">Loading syllabi...</div>
                  ) : (
                    (syllabiMap[course.id] || []).map((s) => (
                      <a
                        key={s.id}
                        href={s.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="syllabus-link"
                      >
                        {s.term} {s.year} – {s.professor}
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && (
        <div className="upload-banner">
          <p>Have a syllabus for a {subject?.toUpperCase()} course?</p>
          <Button onClick={() => navigate("/uploadsyllabus")}>
            Upload a Syllabus
          </Button>
        </div>
      )}

      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          ↑ Scroll to Top
        </button>
      )}
    </div>
  );
}
