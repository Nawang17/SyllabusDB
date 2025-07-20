import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router";
import { db } from "../../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  IconChevronDown,
  IconChevronRight,
  IconCopy,
} from "@tabler/icons-react";
import { ActionIcon, Button } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import "./SubjectPage.css";

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
  const [debouncedSearch] = useDebouncedValue(search, 250);

  const URLquery = new URLSearchParams(useLocation().search);
  const searchAppliedRef = useRef(false);
  const navigate = useNavigate();

  const termOrder = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", () =>
      setShowScrollTop(window.scrollY > 400)
    );
    return () => window.removeEventListener("scroll", () => {});
  }, []);

  useEffect(() => {
    scrollToTop();
  }, []);

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
          (sum, c) => sum + (c.approvedSyllabiCount || 0),
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
        const snap = await getDoc(doc(db, "colleges", collegeId));
        if (snap.exists()) setCollegeNickname(snap.data().nickname || "");
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
          c.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    );
  }, [debouncedSearch, courses]);

  useEffect(() => {
    if (searchAppliedRef.current) return;

    const courseQuery = URLquery.get("course");
    if (!courseQuery || courses.length === 0) return;

    setSearch(courseQuery);
    searchAppliedRef.current = true;

    const matched = courses.find(
      (c) => c.code.toLowerCase().trim() === courseQuery.toLowerCase().trim()
    );

    if (matched) {
      toggleExpand(matched.id);

      // Force scroll after short delay (to wait for expand animation & DOM paint)
      setTimeout(() => {
        const el = document.getElementById(`course-${matched.id}`);
        if (el) {
          const yOffset = -80; // adjust this based on your header height
          const y =
            el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 600); // adjust if your animation is longer
    }
  }, [courses]);

  const toggleExpand = async (courseId) => {
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }));

    // Wait a tick to ensure DOM updates
    setTimeout(() => {
      const el = document.getElementById(`course-${courseId}`);
      if (el) {
        const yOffset = -80; // offset for sticky headers if needed
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 50);

    if (!syllabiMap[courseId]) {
      const course = courses.find((c) => c.id === courseId);
      if (!course || course.approvedSyllabiCount === 0) return;

      setLoadingCourseId(courseId);
      try {
        const snapshot = await getDocs(
          query(
            collection(
              db,
              "colleges",
              collegeId,
              "courses",
              courseId,
              "syllabi"
            ),
            where("approved", "==", true)
          )
        );
        const syllabi = snapshot.docs.map((doc) => doc.data());
        syllabi.sort(
          (a, b) => b.year - a.year || termOrder[b.term] - termOrder[a.term]
        );
        setSyllabiMap((prev) => ({ ...prev, [courseId]: syllabi }));
      } catch (err) {
        console.error("Error fetching syllabi:", err);
      } finally {
        setLoadingCourseId(null);
      }
    }
  };

  const highlightText = (text) => {
    if (!debouncedSearch) return text;
    const regex = new RegExp(`(${debouncedSearch})`, "gi");
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: text.replace(regex, "<mark>$1</mark>"),
        }}
      />
    );
  };

  const formatCollegeName = (str) =>
    str
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div className="college-page">
      <div className="college-header">
        <div>
          <div className="college-title">
            <strong>{subject?.toUpperCase()}</strong> syllabi
          </div>
          <div
            style={{ fontSize: "0.9rem", fontWeight: "500", cursor: "pointer" }}
            onClick={() => navigate(`/college/${collegeId}`)}
          >
            {formatCollegeName(collegeId)}
          </div>
        </div>
      </div>

      <div className="breadcrumb-nav">
        <Link to="/" className="breadcrumb-link breadcrumb-home">
          Home
        </Link>
        <IconChevronRight size={16} />
        <Link to={`/college/${collegeId}`} className="breadcrumb-link">
          {collegeNickname || formatCollegeName(collegeId)}
        </Link>
        <IconChevronRight size={16} />
        <div className="breadcrumb-current">{subject?.toUpperCase()}</div>
      </div>

      {!loading && (
        <>
          <div className="total-syllabi-banner">
            <span className="syllabi-count">{totalSyllabiCount}</span> course
            syllabi available
          </div>
          <div className="search-and-controls">
            <input
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
          <Button onClick={() => navigate("/uploadsyllabus")}>
            Upload a syllabus
          </Button>
        </div>
      ) : (
        <div className="course-list">
          {filteredCourses.map((course) => (
            <div
              className="course-card"
              key={course.id}
              id={`course-${course.id}`}
            >
              <div
                className="course-header"
                onClick={() => toggleExpand(course.id)}
              >
                <div>
                  <div className="course-code">
                    {highlightText(course.code)}
                  </div>
                  <div className="course-title">
                    {highlightText(course.title)}
                  </div>
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
                      <div key={s.id} className="syllabus-item">
                        <a
                          href={s.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="syllabus-link"
                        >
                          {s.term} {s.year} – {s.professor}
                        </a>
                        <ActionIcon
                          className="share-button"
                          variant="subtle"
                          size="lg"
                          radius="md"
                          aria-label="Copy syllabus link"
                          onClick={() => {
                            const url = `${window.location.origin}${
                              window.location.pathname
                            }?course=${encodeURIComponent(course.code)}`;
                            navigator.clipboard.writeText(url).then(() => {
                              notifications.show({
                                position: "bottom-center",
                                title: "Link copied",
                                message:
                                  "The syllabus link has been copied to your clipboard.",
                                icon: <IconCopy size={16} />,
                                color: "blue",
                              });
                            });
                          }}
                        >
                          <IconCopy size={18} />
                        </ActionIcon>
                      </div>
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
