import {
  courseCodeMatches,
  extractSubject,
  normalizeCourseCode,
} from "../../utils/courseCode.js";
import { useEffect, useMemo, useRef, useState } from "react";
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
  IconArrowLeft,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconQuote,
  IconMessageCircle,
  IconStarFilled,
} from "@tabler/icons-react";

import { Button, Paper, Text, Group, Collapse, ThemeIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import "./SubjectPage.css";

function SyllabusRow({ s, collegeId, subject, courseId }) {
  const [open, setOpen] = useState(false);
  const hasExp = !!s.experience_text?.trim();
  const label = [ [s.term, s.year].filter(Boolean).join(" "), s.professor ].filter(Boolean).join(" — ") || "View syllabus";
  const viewerPath =
      `/college/${encodeURIComponent(collegeId)}` +
        `/subject/${encodeURIComponent(subject)}` +
        `/course/${encodeURIComponent(courseId)}` +
        `/syllabus/${encodeURIComponent(s.id)}`;
  const ratingValue = Number(s.rating || 0);
  const hasRating = ratingValue > 0;

  const ratingLabel = {
    1: "Rough",
    2: "Tough",
    3: "Okay",
    4: "Good",
    5: "Recommend",
  };
  return (
    <Paper withBorder radius="md" className="syllabus-card">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Link
            to={viewerPath}
            className="syllabus-title-link"
            style={{ cursor: "pointer" }}
          >
            <div>
              <Text fw={600} className="syllabus-title">
                {label}
              </Text>

              {hasRating && (
                <Group gap={6} mt={4}>
                  <ThemeIcon
                    size="sm"
                    radius="xl"
                    color="yellow"
                    variant="light"
                  >
                    <IconStarFilled size={13} />
                  </ThemeIcon>

                  <Text size="xs" fw={700} c="dimmed">
                    {ratingValue}/5 · {ratingLabel[ratingValue]}
                  </Text>
                </Group>
              )}
            </div>
          </Link>
        </Group>

        <Group gap={"sm"} wrap="nowrap">
          {hasExp && (
            <ThemeIcon
              component="button"
              type="button"
              aria-label={open ? "Hide student review" : "Show student review"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              style={{
                cursor: "pointer",
              }}
              variant="light"
              radius="md"
              size="lg"
            >
              <IconMessageCircle size={17} stroke={1.7} />
            </ThemeIcon>
          )}
          <ThemeIcon
            component="button"
            type="button"
            aria-label="Copy syllabus link"
            onClick={() => {
              const url =
                `${window.location.origin}` +
                `/college/${encodeURIComponent(collegeId)}` +
                `/subject/${encodeURIComponent(subject)}` +
                `/course/${encodeURIComponent(courseId)}` +
                `/syllabus/${encodeURIComponent(s.id)}`;

              navigator.clipboard.writeText(url).then(() => {
                // fallback: show your notification/toast
                notifications.show({
                  position: "top-center",
                  title: "Link copied",
                  message:
                    "The syllabus link has been copied to your clipboard.",
                  color: "blue",
                });
              }).catch(() => notifications.show({ color: "red", message: "Couldn't copy the link. Please try again." }));
            }}
            style={{
              cursor: "pointer",
            }}
            variant="light"
            radius="md"
            size="lg"
          >
            <IconCopy size={17} stroke={1.7} />
          </ThemeIcon>
        </Group>
      </Group>

      {hasExp && (
        <Collapse in={open}>
          <Paper
            radius="md"
            className="experience-quote"
            mt="md"
            p="md"
            withBorder
          >
            <Group gap="sm" align="flex-start" wrap="nowrap">
              <ThemeIcon radius="xl" variant="light">
                <IconQuote size={16} />
              </ThemeIcon>
              <Text
                className="experience-text"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {s.experience_text}
              </Text>
            </Group>
          </Paper>
        </Collapse>
      )}
    </Paper>
  );
}

export default function SubjectPage() {
  const { collegeId, subject } = useParams();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [syllabiMap, setSyllabiMap] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCourseId, setLoadingCourseId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [totalSyllabiCount, setTotalSyllabiCount] = useState(0);
  const [collegeNickname, setCollegeNickname] = useState("");
  const [resolvedCollegeId, setResolvedCollegeId] = useState(null);
  const [resolvedCollegeData, setResolvedCollegeData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [syllabiErrors, setSyllabiErrors] = useState({});

  const resolveCollegeId = async (param) => {
    // 1. Try direct document ID first
    const directSnap = await getDoc(doc(db, "colleges", param));

    if (directSnap.exists()) {
      return {
        id: directSnap.id,
        ...directSnap.data(),
      };
    }

    // 2. Try slug
    const slugSnap = await getDocs(
      query(collection(db, "colleges"), where("slug", "==", param)),
    );

    if (!slugSnap.empty) {
      const d = slugSnap.docs[0];
      return {
        id: d.id,
        ...d.data(),
      };
    }

    // 3. Try aliases
    const aliasSnap = await getDocs(
      query(
        collection(db, "colleges"),
        where("aliases", "array-contains", param),
      ),
    );

    if (!aliasSnap.empty) {
      const d = aliasSnap.docs[0];
      return {
        id: d.id,
        ...d.data(),
      };
    }

    return null;
  };
  useEffect(() => {
    const run = async () => {
      if (!collegeId) return;
      setLoading(true);
      setLoadError("");
      try {
      const college = await resolveCollegeId(collegeId);

      if (!college) {
        setResolvedCollegeId(null);
        setResolvedCollegeData(null);
        setLoading(false);
        setLoadError("This college couldn't be found.");
        return;
      }

      setResolvedCollegeId(college.id);
      setResolvedCollegeData(college);
      } catch (err) {
        console.error("Could not resolve college:", err);
        setLoadError("We couldn't load this college. Please try again later.");
        setLoading(false);
      }
    };

    run();
  }, [collegeId]);
  const URLquery = new URLSearchParams(useLocation().search);
  const searchAppliedRef = useRef(false);
  const navigate = useNavigate();

  const termOrder = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const courseQuery = query(
          collection(db, "colleges", resolvedCollegeId, "courses"),
          where("approved", "==", true),
        );
        const snapshot = await getDocs(courseQuery);
        const allCourses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const filtered = allCourses.filter(
          (course) =>
            course.code &&
            extractSubject(course.code) === (subject || "").toUpperCase(),
        ).sort((a, b) => normalizeCourseCode(a.code).localeCompare(normalizeCourseCode(b.code), undefined, { numeric: true }));
        const total = filtered.reduce(
          (sum, c) => sum + (c.approvedSyllabiCount || 0),
          0,
        );
        setCourses(filtered);
        setTotalSyllabiCount(total);
      } catch (err) {
        console.error("Failed to fetch subject courses:", err);
        setLoadError("We couldn't load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (resolvedCollegeId) fetchCourses();
  }, [resolvedCollegeId, subject]);

  useEffect(() => {
    const fetchCollegeNickname = async () => {
      try {
        const snap = await getDoc(doc(db, "colleges", resolvedCollegeId));
        if (snap.exists()) setCollegeNickname(snap.data().nickname || "");
      } catch (err) {
        console.error("Failed to fetch college nickname:", err);
      }
    };
    if (resolvedCollegeId) fetchCollegeNickname();
  }, [resolvedCollegeId]);

  const filteredCourses = useMemo(() => {
    const q = search.trim();
    return courses.filter((course) =>
      courseCodeMatches(course.code, q) ||
      String(course.title || "").toLowerCase().includes(q.toLowerCase()),
    );
  }, [search, courses]);

  useEffect(() => {
    if (searchAppliedRef.current) return;
    const courseQuery = URLquery.get("course");
    if (!courseQuery || courses.length === 0) return;

    setSearch(courseQuery);
    searchAppliedRef.current = true;

    const matched = courses.find((c) => courseCodeMatches(c.code, courseQuery));
    if (matched) {
      toggleExpand(matched.id);
      setTimeout(() => {
        const el = document.getElementById(`course-${matched.id}`);
        if (el) {
          const yOffset = -80;
          const y =
            el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 600);
    }
  }, [courses]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = async (courseId) => {
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }));

    if (!syllabiMap[courseId]) {
      const course = courses.find((c) => c.id === courseId);
      if (!course || course.approvedSyllabiCount === 0) return;

      setLoadingCourseId(courseId);
      setSyllabiErrors((prev) => ({ ...prev, [courseId]: "" }));
      try {
        const snapshot = await getDocs(
          query(
            collection(
              db,
              "colleges",
              resolvedCollegeId,
              "courses",
              courseId,
              "syllabi",
            ),
            where("approved", "==", true),
          ),
        );
        const syllabi = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        syllabi.sort(
          (a, b) => b.year - a.year || termOrder[b.term] - termOrder[a.term],
        );
        setSyllabiMap((prev) => ({ ...prev, [courseId]: syllabi }));
      } catch (err) {
        console.error("Error fetching syllabi:", err);
        setSyllabiErrors((prev) => ({ ...prev, [courseId]: "We couldn't load syllabi. Close and reopen this course to retry." }));
      } finally {
        setLoadingCourseId(null);
      }
    }
  };

  const highlightText = (text) => {
    const value = String(text || "");
    const queryText = search.trim();
    if (!queryText) return value;
    const index = value.toLowerCase().indexOf(queryText.toLowerCase());
    if (index < 0) return value;
    return <>{value.slice(0, index)}<mark>{value.slice(index, index + queryText.length)}</mark>{value.slice(index + queryText.length)}</>;
  };

  const formatCollegeName = (str = "") =>
    str
      ?.split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <main className="subject-page">
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <Link to={`/college/${encodeURIComponent(resolvedCollegeId || collegeId)}`} className="breadcrumb-link">
          <IconArrowLeft size={18} stroke={1.8} aria-hidden="true" />{resolvedCollegeData?.name || collegeNickname || formatCollegeName(collegeId)}
        </Link>
      </nav>
      <div className="college-header">
        <div>
          <h1 className="college-title">{subject?.toUpperCase()} syllabi</h1>
          {!loading && !loadError && <p className="subject-summary">{courses.length} {courses.length === 1 ? "course" : "courses"} · {totalSyllabiCount.toLocaleString()} {totalSyllabiCount === 1 ? "syllabus" : "syllabi"}</p>}
        </div>
        <Link className="subject-upload-link" to={`/uploadsyllabus/${encodeURIComponent(resolvedCollegeId || collegeId)}`}>Upload a syllabus</Link>
      </div>

      {!loading && !loadError && (
        <>
          <div className="search-and-controls">
            <h2>Browse courses</h2>
            <input
              type="search"
              aria-label="Search by course code or name"
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
      ) : loadError ? (
        <div className="no-courses-found" role="alert"><p>{loadError}</p><Link to={`/college/${encodeURIComponent(collegeId)}`}>Back to college</Link></div>
      ) : filteredCourses.length === 0 ? (
        <div className="no-courses-found">
          {search.trim() ? (
            <p>No courses match your search.</p>
          ) : (
            <p>
              No syllabi available for this subject yet. You can help by
              uploading one!
            </p>
          )}
          {search.trim() ? <Button variant="light" onClick={() => setSearch("")}>Clear search</Button> : <Button
            onClick={() => navigate(`/uploadsyllabus/${resolvedCollegeId}`)}
          >
            Upload a Syllabus
          </Button>}
        </div>
      ) : (
        <div className="course-list">
          {filteredCourses.map((course) => (
            <div
              className="course-card"
              key={course.id}
              id={`course-${course.id}`}
            >
              <button
                type="button"
                className="course-header"
                aria-expanded={!!expanded[course.id]}
                aria-controls={`syllabi-${course.id}`}
                onClick={() => toggleExpand(course.id)}
              >
                <span>
                  <span className="course-code">
                    {highlightText(normalizeCourseCode(course.code))}
                  </span>
                  <span className="course-title">
                    {highlightText(course.title)}
                  </span>
                </span>
                <span className="course-syllabi-count">{(course.approvedSyllabiCount || 0).toLocaleString()} {course.approvedSyllabiCount === 1 ? "syllabus" : "syllabi"}</span>
                <span className="expand-icon" aria-hidden="true">
                  {expanded[course.id] ? (
                    <IconChevronDown />
                  ) : (
                    <IconChevronRight />
                  )}
                </span>
              </button>

              {expanded[course.id] && (
                <div
                  className="syllabi-list"
                  id={`syllabi-${course.id}`}
                >
                  {loadingCourseId === course.id ? (
                    <div className="loading-syllabi">Loading syllabi...</div>
                  ) : syllabiErrors[course.id] ? <p role="alert" className="loading-syllabi">{syllabiErrors[course.id]}</p> : !(syllabiMap[course.id] || []).length ? <p className="loading-syllabi">No published syllabi for this course yet.</p> : (
                    (syllabiMap[course.id] || []).map((s) => {
                      const copyAction = () => {
                        const url = `${window.location.origin}${
                          window.location.pathname
                        }?course=${encodeURIComponent(course.code)}`;
                        navigator.clipboard.writeText(url).then(() => {
                          notifications.show({
                            position: "top-center",
                            title: "Link copied",
                            message:
                              "The syllabus link has been copied to your clipboard.",
                            icon: <IconCopy size={16} />,
                            color: "blue",
                          });
                        });
                      };

                      return (
                        <SyllabusRow
                          key={s.id}
                          s={s}
                          courseCode={course.code}
                          onCopy={copyAction}
                          collegeId={resolvedCollegeId}
                          subject={subject}
                          courseId={course.id}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !loadError && filteredCourses.length !== 0 && (
        <div className="upload-banner">
          <p>Have a syllabus for a {subject?.toUpperCase()} course?</p>
          <Button onClick={() => navigate(`/uploadsyllabus/${collegeId}`)}>
            Upload a Syllabus
          </Button>
        </div>
      )}

      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          ↑ Scroll to Top
        </button>
      )}
    </main>
  );
}
