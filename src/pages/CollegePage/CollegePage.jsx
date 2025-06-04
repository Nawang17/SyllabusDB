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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
            src="/src/assets/5203299.jpg"
            alt="Error"
            style={{ width: "300px", height: "300px" }}
          />
          <p>{error}</p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </Flex>
      ) : (
        <div className="college-page">
          {collegeImage ? (
            <Image
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
              src={collegeImage}
            />
          ) : (
            <Skeleton height={"200px"} mb="1rem" radius="md" />
          )}

          <div className="college-header">
            <div>
              <div className="college-title">{collegeName}</div>
              <Flex align={"center"} gap={"0.5rem"}>
                <IconMapPin color="#888" />

                <div className="college-location"> {collegeLocation}</div>
              </Flex>
            </div>
            <Button onClick={() => navigate("/uploadsyllabus")}>
              Upload Syllabus
            </Button>
          </div>

          <div className="search-and-controls">
            <input
              type="text"
              className="syllabus-search"
              placeholder="Search course by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!loading && (
              <div className="course-count">
                {filteredCourses.length} courses available
              </div>
            )}
          </div>

          {!loading && filteredCourses.length === 0 && (
            <div className="no-courses-found">
              <p>No courses match your search. Try a different name or code.</p>
              <Button size="md" onClick={() => navigate("/uploadsyllabus")}>
                Upload Syllabus
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
        </div>
      )}
    </>
  );
}
