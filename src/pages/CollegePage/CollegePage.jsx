import { useEffect, useState } from "react";
import "./CollegePage.css";
import { useNavigate, useParams } from "react-router";
import { db } from "../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

export default function CollegePage() {
  const [loading, setLoading] = useState(true);
  const [loadingCourseId, setLoadingCourseId] = useState(null);

  const { collegeId } = useParams();
  const [courses, setCourses] = useState([]);
  const [syllabiMap, setSyllabiMap] = useState({});
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const courseRef = collection(db, "colleges", collegeId, "courses");
        const snapshot = await getDocs(courseRef);

        const filteredCourses = [];
        for (const docSnap of snapshot.docs) {
          const syllabiRef = collection(
            db,
            "colleges",
            collegeId,
            "courses",
            docSnap.id,
            "syllabi"
          );
          const syllabiSnap = await getDocs(syllabiRef);
          const hasApproved = syllabiSnap.docs.some(
            (doc) => doc.data().approved
          );
          if (hasApproved) {
            filteredCourses.push({
              id: docSnap.id,
              ...docSnap.data(),
            });
          }
        }
        setCourses(filteredCourses);
        console.log("Fetched courses:", filteredCourses);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [collegeId]);

  const termOrder = {
    Spring: 1,
    Summer: 2,
    Fall: 3,
    Winter: 4,
  };

  const toggleExpand = async (courseId) => {
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }));

    if (!syllabiMap[courseId]) {
      setLoadingCourseId(courseId);
      try {
        const syllabiRef = collection(
          db,
          "colleges",
          collegeId,
          "courses",
          courseId,
          "syllabi"
        );
        const snapshot = await getDocs(syllabiRef);
        const storage = getStorage();

        const syllabi = await Promise.all(
          snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((s) => s.approved)
            .map(async (s) => {
              let url = s.pdf_url;
              if (url.startsWith("gs://")) {
                try {
                  const filePath = url.replace(
                    "gs://syllabusdb-a9cc8.appspot.com/",
                    ""
                  );
                  const storageRef = ref(storage, filePath);
                  url = await getDownloadURL(storageRef);
                } catch (e) {
                  console.error("Failed to convert gs:// URL", e);
                  url = null;
                }
              }
              return { ...s, pdf_url: url };
            })
        );

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

  const filteredCourses = courses
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

  return (
    <div className="college-page">
      <div className="college-title">
        {collegeId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())}
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
          <button onClick={() => navigate("/uploadsyllabus")}>
            Upload Syllabus
          </button>
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

      {!loading && filteredCourses.length !== 0 && (
        <button
          className="upload-button"
          onClick={() => navigate("/uploadsyllabus")}
        >
          + Upload Syllabus
        </button>
      )}
    </div>
  );
}
