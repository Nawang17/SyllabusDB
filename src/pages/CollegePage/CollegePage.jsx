import { useEffect, useState } from "react";
import "./CollegePage.css";
import { useNavigate, useParams } from "react-router";
import { db } from "../../../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  IconChevronDown,
  IconChevronRight,
  IconMapPin,
} from "@tabler/icons-react";
import { Button, Flex, Image, Skeleton } from "@mantine/core";
import errorImage from "../../assets/5203299.jpg"; // Error image for not found
export default function CollegePage() {
  const [loading, setLoading] = useState(true);
  const [loadingCourseId, setLoadingCourseId] = useState(null);

  const { collegeId } = useParams();
  const [courses, setCourses] = useState([]);
  const [syllabiMap, setSyllabiMap] = useState({});
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [collegeName, setCollegeName] = useState("");
  const [collegeLocation, setCollegeLocation] = useState("");
  const [collegeImage, setCollegeImage] = useState("");
  const [error, setError] = useState(null);
  const [totalSyllabiCount, setTotalSyllabiCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  {
    showScrollTop && (
      <button className="scroll-to-top" onClick={scrollToTop}>
        ↑ Top
      </button>
    );
  }

  useEffect(() => {
    const fetchCollegeAndCourses = async () => {
      try {
        setLoading(true);

        // Fetch the specific college document by ID
        const collegeDocRef = doc(db, "colleges", collegeId);
        const collegeDocSnap = await getDoc(collegeDocRef);

        if (collegeDocSnap.exists()) {
          const data = collegeDocSnap.data();
          setCollegeImage(data.image_url || null);
          setCollegeName(data.name || "");
          setCollegeLocation(`${data.city || ""}, ${data.state || ""}`);
        } else {
          setError("College not found. Please check the URL.");
          return;
        }

        // Query only approved courses
        const courseQuery = query(
          collection(db, "colleges", collegeId, "courses"),
          where("approved", "==", true)
        );
        const courseSnapshot = await getDocs(courseQuery);

        setCourses(
          courseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        let syllabiCount = 0;

        for (const doc of courseSnapshot.docs) {
          syllabiCount += doc.data().approvedSyllabiCount || 0;
        }

        setTotalSyllabiCount(syllabiCount);
      } catch (err) {
        setError("Failed to fetch college or courses. Please try again later.");
        console.error("Failed to fetch college or courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeAndCourses();
  }, [collegeId]);

  const termOrder = {
    Spring: 1,
    Summer: 2,
    Fall: 3,
    Winter: 4,
  };

  const toggleExpand = async (courseId) => {
    // Toggle the expanded state for this course
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }));

    // If syllabi for this course haven't been fetched yet
    if (!syllabiMap[courseId]) {
      setLoadingCourseId(courseId);

      try {
        // Query only approved syllabi to avoid Firestore permission errors
        const syllabiQuery = query(
          collection(db, "colleges", collegeId, "courses", courseId, "syllabi"),
          where("approved", "==", true)
        );
        const snapshot = await getDocs(syllabiQuery);

        //get  syllabus data
        const syllabi = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort syllabi by year and term
        syllabi.sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return termOrder[b.term] - termOrder[a.term];
        });

        // Store result in state map
        setSyllabiMap((prev) => ({ ...prev, [courseId]: syllabi }));
      } catch (err) {
        console.error("Error fetching syllabi:", err);
      } finally {
        setLoadingCourseId(null);
      }
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {!loading && error ? (
        <Flex gap={"1rem"} direction="column" align="center" justify="center">
          <Image
            src={errorImage}
            alt="Error"
            style={{ width: "300px", height: "300px" }}
          />
          <p>{error}</p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </Flex>
      ) : (
        <div className="college-page">
          {collegeImage ? (
            <div className="college-hero">
              <Image
                src={collegeImage}
                className="college-hero-img"
                alt={collegeName}
              />
              <div className="college-hero-overlay">
                <div className="college-hero-title">{collegeName}</div>
                <div className="college-hero-location">
                  <IconMapPin size={16} /> {collegeLocation}
                </div>
              </div>
            </div>
          ) : (
            <Skeleton height={"200px"} mb="1rem" radius="md" />
          )}
          {courses.length > 0 && (
            <div className="college-header">
              <Button onClick={() => navigate("/uploadsyllabus")}>
                Upload Syllabus
              </Button>
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div className="total-syllabi-banner">
              Browse <span className="syllabi-count">{totalSyllabiCount}</span>{" "}
              course syllabi
            </div>
          )}

          <div className="search-and-controls">
            <input
              type="text"
              className="syllabus-search"
              placeholder="Search course by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!loading && filteredCourses.length === 0 && (
            <div className="no-courses-found">
              {courses.length > 0 ? (
                <p>
                  No courses matched your search. Try a different name or course
                  code.
                </p>
              ) : (
                <>
                  <p>No courses have been added for this college yet.</p>
                  <p> Be the first to share a syllabus!</p>
                </>
              )}
              <Button size="md" onClick={() => navigate("/uploadsyllabus")}>
                Upload a Syllabus
              </Button>
            </div>
          )}

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

          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading courses...</p>
            </div>
          )}
          {showScrollTop && (
            <button className="scroll-to-top" onClick={scrollToTop}>
              ↑ Scroll to Top
            </button>
          )}
        </div>
      )}
    </>
  );
}
