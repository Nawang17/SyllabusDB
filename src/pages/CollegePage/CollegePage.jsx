import { useEffect, useState } from "react";
import "./CollegePage.css";
import { Link, useNavigate, useParams } from "react-router";
import { analytics, db } from "../../../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { IconChevronRight, IconMapPin } from "@tabler/icons-react";
import { Button, Flex, Image, Skeleton } from "@mantine/core";
import errorImage from "../../assets/5203299.jpg"; // Error image for not found
import { logEvent } from "firebase/analytics";
import { IconInfoCircle } from "@tabler/icons-react";
import { Alert } from "@mantine/core";
export default function CollegePage() {
  const [showExtensionAlert, setShowExtensionAlert] = useState(() => {
    return localStorage.getItem("dismissedExtensionAlert") !== "true";
  });

  const handleCloseExtensionAlert = () => {
    setShowExtensionAlert(false);
    localStorage.setItem("dismissedExtensionAlert", "true");
  };
  const [loading, setLoading] = useState(true);

  const { collegeId } = useParams();
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [collegeName, setCollegeName] = useState("");
  const [collegeLocation, setCollegeLocation] = useState("");
  const [collegeImage, setCollegeImage] = useState("");
  const [error, setError] = useState(null);
  const [totalSyllabiCount, setTotalSyllabiCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [subjectMap, setSubjectMap] = useState({});
  const [nickname, setNickname] = useState("");
  useEffect(() => {
    if (collegeId && analytics) {
      logEvent(analytics, "view_college_page", {
        college_id: collegeId,
      });
    }
  }, [collegeId]);

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

  useEffect(() => {
    const fetchCollegeAndCourses = async () => {
      try {
        setLoading(true);
        const collegeDocRef = doc(db, "colleges", collegeId);
        const collegeDocSnap = await getDoc(collegeDocRef);

        if (!collegeDocSnap.exists()) {
          setError("College not found.");
          return;
        }

        const data = collegeDocSnap.data();
        setNickname(data.nickname || "");
        setCollegeImage(data.image_url || null);
        setCollegeName(data.name || "");
        setCollegeLocation(`${data.city || ""}, ${data.state || ""}`);
        setTotalSyllabiCount(data.approvedSyllabiTotal || 0);
        const courseQuery = query(
          collection(db, "colleges", collegeId, "courses"),
          where("approved", "==", true)
        );
        const courseSnapshot = await getDocs(courseQuery);
        const courseList = courseSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(courseList);

        const grouped = {};

        for (const course of courseList) {
          const subjectCode = course.code.split(" ")[0].toUpperCase(); // get e.g., 'CSCI'
          const count = course.approvedSyllabiCount || 0;

          if (!grouped[subjectCode]) {
            grouped[subjectCode] = { syllabiCount: 0, courses: [] };
          }

          grouped[subjectCode].syllabiCount += count;
          grouped[subjectCode].courses.push(course);
        }

        setSubjectMap(grouped);
      } catch (err) {
        console.error("Error:", err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeAndCourses();
  }, [collegeId]);

  const filteredSubjects = Object.entries(subjectMap)
    .filter(([subject]) => subject.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[1].syllabiCount - a[1].syllabiCount);

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
          {showExtensionAlert && (
            <div
              style={{
                marginBottom: "1.5rem",
              }}
            >
              <Alert
                variant="light"
                color="blue"
                title="Using CUNY Schedule Builder?"
                icon={<IconInfoCircle />}
                withCloseButton
                onClose={handleCloseExtensionAlert}
              >
                <span>
                  You can now see syllabus links directly in Schedule Builder
                  with our{" "}
                  <a
                    href="https://chromewebstore.google.com/detail/syllabusdb-for-schedule-b/kggnbpofeleldhpmamlmjidieheobhni"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontWeight: 500,
                      textDecoration: "underline",
                      color: "#1d4ed8",
                    }}
                  >
                    Chrome Extension
                  </a>
                  .
                </span>
              </Alert>
            </div>
          )}
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

          <div className="college-header">
            <div className="breadcrumb-nav">
              <Link to={`/`} className="breadcrumb-link">
                Home
              </Link>
              <IconChevronRight size={16} />
              <Link to={`/college/${collegeId}`} className="breadcrumb-current">
                {nickname ? nickname : collegeName}
              </Link>
            </div>
            {courses.length > 0 && (
              <Button onClick={() => navigate(`/uploadsyllabus/${collegeId}`)}>
                Upload Syllabus
              </Button>
            )}
          </div>

          {!loading && courses.length > 0 && (
            <>
              <div className="total-syllabi-banner">
                Browse{" "}
                <span className="syllabi-count">{totalSyllabiCount}</span>{" "}
                course syllabi
              </div>
              <div className="search-and-controls">
                <label htmlFor="subject-search" className="search-label">
                  Search for your subject
                </label>
                <input
                  id="subject-search"
                  type="text"
                  className="syllabus-search"
                  placeholder="e.g. CSCI, ACC, MATH..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </>
          )}
          {!loading && (
            <div className="subject-list">
              {filteredSubjects.length === 0 && !loading ? (
                <div className="no-courses-found">
                  {courses.length > 0 ? (
                    <p>
                      No subjects matched your search. Try a different name .
                    </p>
                  ) : (
                    <>
                      <p>No syllabi have been added for this college yet.</p>
                      <p> Be the first to share a syllabus!</p>
                    </>
                  )}
                  <Button
                    onClick={() => navigate(`/uploadsyllabus/${collegeId}`)}
                  >
                    Upload Syllabus
                  </Button>
                </div>
              ) : (
                filteredSubjects.map(([subject, data]) => (
                  <div
                    key={subject}
                    className="subject-card fade-in"
                    onClick={() =>
                      navigate(`/college/${collegeId}/subject/${subject}`)
                    }
                  >
                    <div className="subject-main">
                      <div className="subject-title">
                        {search ? (
                          <>
                            {subject.slice(
                              0,
                              subject
                                .toLowerCase()
                                .indexOf(search.toLowerCase())
                            )}
                            <strong>
                              {subject.slice(
                                subject
                                  .toLowerCase()
                                  .indexOf(search.toLowerCase()),
                                subject
                                  .toLowerCase()
                                  .indexOf(search.toLowerCase()) + search.length
                              )}
                            </strong>
                            {subject.slice(
                              subject
                                .toLowerCase()
                                .indexOf(search.toLowerCase()) + search.length
                            )}
                          </>
                        ) : (
                          subject
                        )}
                      </div>

                      <div className="subject-count">
                        {data.syllabiCount} syllabi
                      </div>
                    </div>
                    <div className="expand-icon">
                      <IconChevronRight />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading subjects...</p>
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
