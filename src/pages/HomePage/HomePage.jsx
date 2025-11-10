import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import "./HomePage.css";
import studentImage from "../../assets/studentshangingout.jpg";
import verifiedImage from "../../assets/verified-illustration.jpg";
import CountUp from "react-countup";

const TOP_CACHE_KEY = "topColleges:v1";
const TOP_CACHE_TTL_MS = 60 * 1000; // 1 minute

const IDX_CACHE_KEY = "collegesIndex:v1";
const IDX_CACHE_TTL_MS = 60 * 1000; // 1 minute

const RECENT_SYL_CACHE_KEY = "recentSyllabi:v1";
const RECENT_SYL_CACHE_TTL_MS = 60 * 1000; // 1 minute

// 🔹 Cache for course docs to avoid repeated reads (10 min TTL)
const COURSE_CACHE_KEY = "courseHydrationCache:v1";
const COURSE_CACHE_TTL_MS = 10 * 60 * 1000;

function readCourseCache() {
  try {
    const raw = localStorage.getItem(COURSE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return {};
}
function writeCourseCache(cacheObj) {
  try {
    localStorage.setItem(COURSE_CACHE_KEY, JSON.stringify(cacheObj));
  } catch {}
}

function useOnScreen(ref, rootMargin = "200px") {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

function timeSince(tsMillis) {
  const s = Math.max(1, Math.floor((Date.now() - tsMillis) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Build a clean display string for a course
function formatCourseTitle(courseDoc, courseId) {
  const code =
    courseDoc?.code ||
    courseDoc?.courseCode ||
    courseDoc?.course_code ||
    courseId ||
    "";
  const title =
    courseDoc?.title || courseDoc?.courseTitle || courseDoc?.name || "";

  const left = String(code).trim();
  const right = String(title).trim();

  if (left && right) return `${left}: ${right}`;
  if (left) return left;
  if (right) return right;
  return "Untitled Course";
}

export default function HomePage() {
  // Top list for scroller
  const [topColleges, setTopColleges] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);

  // Search index (full list)
  const [searchIndex, setSearchIndex] = useState([]); // [{id,name,image_url?}]
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [indexLoadedOnce, setIndexLoadedOnce] = useState(false);

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [totalUploads, setTotalUploads] = useState(0);
  const [animateCount, setAnimateCount] = useState(false);

  // Recently uploaded syllabi (hydrated with course info)
  const [recentSyllabi, setRecentSyllabi] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const searchInputRef = useRef(null);
  const scrollerRef = useRef(null);
  const recentRef = useRef(null);

  const scrollerIsNear = useOnScreen(scrollerRef);
  const isRecentVisible = useOnScreen(recentRef);

  const navigate = useNavigate();

  // ---- Fetch Top N (fast scroller) ----
  const fetchTopColleges = async (toggleLoading = false) => {
    try {
      if (toggleLoading) setLoadingTop(true);
      const qy = query(
        collection(db, "colleges"),
        orderBy("approvedSyllabiTotal", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(qy);
      const data = snapshot.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          name: x.name,
          image_url: x.image_url,
          uploads: x.approvedSyllabiTotal || 0,
        };
      });
      setTopColleges(data);
      localStorage.setItem(
        TOP_CACHE_KEY,
        JSON.stringify({ data, ts: Date.now() })
      );
    } catch (err) {
      console.error("Error fetching top colleges:", err);
    } finally {
      if (toggleLoading) setLoadingTop(false);
    }
  };

  // ---- Fetch Search Index (ALL colleges, light fields) ----
  const fetchSearchIndex = async (force = false) => {
    try {
      // SWR cache
      if (!force) {
        const raw = localStorage.getItem(IDX_CACHE_KEY);
        if (raw) {
          try {
            const { data, ts } = JSON.parse(raw);
            if (Array.isArray(data)) {
              setSearchIndex(data);
              setIndexLoadedOnce(true);
              if (!ts || Date.now() - ts > IDX_CACHE_TTL_MS) {
                void fetchSearchIndex(true);
              }
              return;
            }
          } catch {
            /* fall through */
          }
        }
      }

      setLoadingIndex(true);
      const snap = await getDocs(collection(db, "colleges"));
      const all = snap.docs
        .map((d) => {
          const x = d.data();
          return {
            id: d.id,
            name: x.name || "",
            approved: x.approved !== false,
          };
        })
        .filter((c) => c.approved && c.name);
      setSearchIndex(all);
      setIndexLoadedOnce(true);
      localStorage.setItem(
        IDX_CACHE_KEY,
        JSON.stringify({ data: all, ts: Date.now() })
      );
    } catch (e) {
      console.error("Error fetching search index:", e);
    } finally {
      setLoadingIndex(false);
    }
  };

  // ---- Fetch recently uploaded (approved) syllabi and hydrate with course docs ----
  const fetchRecentSyllabi = async () => {
    try {
      // Step 1: read quick cache for the list itself (IDs + timeAgo etc.)
      const raw = localStorage.getItem(RECENT_SYL_CACHE_KEY);
      if (raw) {
        try {
          const { data, ts } = JSON.parse(raw);
          if (Array.isArray(data)) {
            setRecentSyllabi(data);
            if (ts && Date.now() - ts < RECENT_SYL_CACHE_TTL_MS) return;
          }
        } catch {}
      }

      setLoadingRecent(true);

      // Step 2: get the recent approved syllabi (no course fields here)
      const qy = query(
        collectionGroup(db, "syllabi"),
        where("approved", "==", true),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const snap = await getDocs(qy);

      // Build slim items with path-derived IDs
      const baseItems = snap.docs.map((d) => {
        const x = d.data() || {};
        const createdAtMs =
          x.createdAt?.toMillis?.() ??
          (typeof x.createdAt === "number" ? x.createdAt : Date.now());
        const parts = d.ref.path.split("/"); // colleges/{collegeId}/courses/{courseId}/syllabi/{id}
        const collegeId = parts[1] || "";
        const courseId = parts[3] || "";

        return {
          id: d.id,
          collegeId,
          courseId,
          professor: x.professor || "Unknown Professor",
          createdAtMs,
          timeAgo: timeSince(createdAtMs),
        };
      });

      // Step 3: hydrate courses (cache-aware)
      const courseCache = readCourseCache();
      const now = Date.now();

      // Gather unique course refs that are stale/missing in cache
      const neededKeys = new Set(
        baseItems.map((it) => `${it.collegeId}::${it.courseId}`)
      );

      const fetchTasks = [];
      for (const key of neededKeys) {
        const cached = courseCache[key];
        if (cached && now - (cached.ts || 0) < COURSE_CACHE_TTL_MS) continue;

        const [collegeId, courseId] = key.split("::");
        // Guard for weird paths
        if (!collegeId || !courseId) continue;

        const courseRef = doc(db, "colleges", collegeId, "courses", courseId);
        fetchTasks.push(
          getDoc(courseRef)
            .then((snap) => {
              const data = snap.exists() ? snap.data() : null;
              courseCache[key] = { ts: now, data };
            })
            .catch(() => {
              // Cache a null to avoid hammering in case of perms/missing
              courseCache[key] = { ts: now, data: null };
            })
        );
      }

      if (fetchTasks.length) {
        await Promise.all(fetchTasks);
        writeCourseCache(courseCache);
      }

      // Step 4: merge hydrated course info into items
      const hydrated = baseItems.map((it) => {
        const key = `${it.collegeId}::${it.courseId}`;
        const courseDoc = courseCache[key]?.data || null;

        return {
          ...it,
          courseDisplay: formatCourseTitle(courseDoc, it.courseId),
        };
      });

      setRecentSyllabi(hydrated);
      localStorage.setItem(
        RECENT_SYL_CACHE_KEY,
        JSON.stringify({ data: hydrated, ts: Date.now() })
      );
    } catch (e) {
      console.error("Error fetching recent syllabi:", e);
    } finally {
      setLoadingRecent(false);
    }
  };

  // ---- Initial mount: SWR for top list + stats listener + CountUp gate ----
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Top list SWR
    const raw = localStorage.getItem(TOP_CACHE_KEY);
    if (raw) {
      try {
        const { data, ts } = JSON.parse(raw);
        if (Array.isArray(data)) {
          setTopColleges(data);
          setLoadingTop(false);
        }
        if (!ts || Date.now() - ts > TOP_CACHE_TTL_MS) {
          void fetchTopColleges(true);
        } else {
          void fetchTopColleges(false);
        }
      } catch {
        void fetchTopColleges(true);
      }
    } else {
      void fetchTopColleges(true);
    }

    // Stats listener (live)
    const unsubStats = onSnapshot(
      doc(db, "stats", "global"),
      (snap) => setTotalUploads(snap.data()?.total_syllabi || 0),
      (err) => console.error("stats/global listener error:", err)
    );

    // CountUp visibility (respect reduced motion)
    const countEl = document.querySelector(".hero-syllabi-count");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let io;
    if (!reduce.matches && countEl) {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setAnimateCount(true);
            io.disconnect();
          }
        },
        { rootMargin: "120px" }
      );
      io.observe(countEl);
    }
    return () => {
      unsubStats();
      if (io) io.disconnect();
    };
  }, []);

  // ---- Debounce search input ----
  useEffect(() => {
    const t = setTimeout(
      () => setDebounced(searchQuery.trim().toLowerCase()),
      120
    );
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ---- Lazy-load search index on first interaction ----
  const onSearchFocus = () => {
    if (!indexLoadedOnce && !loadingIndex) void fetchSearchIndex(false);
  };

  // Also trigger when user starts typing
  useEffect(() => {
    if (searchQuery && !indexLoadedOnce && !loadingIndex) {
      void fetchSearchIndex(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ---- Filter against the FULL INDEX, not the top list ----
  const filtered = useMemo(() => {
    if (!debounced) return [];
    const q = debounced;
    return searchIndex
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 20); // cap dropdown size for perf/UX
  }, [searchIndex, debounced]);

  const handleKeyDown = (e) => {
    if (debounced && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filtered.length) % filtered.length
        );
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        navigate(`/college/${filtered[selectedIndex].id}`);
      }
    }
  };

  const highlightMatch = (name) => {
    if (!debounced) return name;
    const index = name.toLowerCase().indexOf(debounced);
    if (index === -1) return name;
    return (
      <>
        {name.slice(0, index)}
        <strong>{name.slice(index, index + debounced.length)}</strong>
        {name.slice(index + debounced.length)}
      </>
    );
  };

  // ---- Lazy-load recent syllabi when section is visible ----
  useEffect(() => {
    if (isRecentVisible && recentSyllabi.length === 0 && !loadingRecent) {
      void fetchRecentSyllabi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecentVisible]);

  return (
    <div className="home-page">
      <section className="search-section">
        <div className="headline">
          <h1>Know the course</h1>
          <h1>before you enroll</h1>
        </div>

        <p className="hero-syllabi-count">
          <strong>
            {animateCount ? (
              <CountUp
                start={Math.max(
                  0,
                  totalUploads - Math.floor(totalUploads * 0.05)
                )}
                end={totalUploads}
                duration={0.7}
                separator=","
              />
            ) : (
              totalUploads.toLocaleString()
            )}
          </strong>{" "}
          syllabi available
        </p>

        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for your college..."
            value={searchQuery}
            onFocus={onSearchFocus}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            ref={searchInputRef}
            aria-label="Search for a college"
            enterKeyHint="search"
            autoComplete="off"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery("")}>
              ×
            </button>
          )}
          {searchQuery && (
            <div className="results-box">
              {loadingIndex && !indexLoadedOnce ? (
                <div className="no-result">Loading colleges…</div>
              ) : filtered.length > 0 ? (
                filtered.map((college, index) => (
                  <div
                    key={college.id}
                    className={`result-item ${
                      selectedIndex === index ? "highlighted" : ""
                    }`}
                    onClick={() => navigate(`/college/${college.id}`)}
                  >
                    {highlightMatch(college.name)}
                  </div>
                ))
              ) : (
                <div className="no-result">
                  <p>No colleges found.</p>
                  <button
                    className="request-college-btn"
                    onClick={() => navigate("/requestcollege")}
                  >
                    Request a College
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Most Shared Syllabi (by college) */}
      <section
        ref={scrollerRef}
        className="college-scroll-wrapper"
        style={{ contentVisibility: "auto", containIntrinsicSize: "640px" }}
      >
        <h2 className="scroll-title">Most Shared Syllabi</h2>
        <div className="college-scroll">
          {loadingTop || !scrollerIsNear
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="college-card skeleton">
                  <div className="skeleton-img" />
                  <div className="skeleton-line short" />
                  <div className="skeleton-line long" />
                </div>
              ))
            : topColleges.map((college, i) => (
                <div
                  key={college.id}
                  className="college-card fade-in"
                  onClick={() => navigate(`/college/${college.id}`)}
                >
                  <img
                    loading="lazy"
                    src={college.image_url}
                    alt={college.name}
                    className="college-img"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/300x200?text=Image+Unavailable";
                    }}
                  />
                  <div className="college-name">
                    {i + 1}. {college.name}
                  </div>
                  {college.uploads > 0 && (
                    <div className="college-count">
                      {college.uploads} syllabi
                    </div>
                  )}
                </div>
              ))}
          {!loadingTop && scrollerIsNear && (
            <div
              className="college-card view-all-card-link fade-in"
              onClick={() => navigate("/colleges")}
            >
              <span className="view-all-link">View All Colleges</span>
            </div>
          )}
        </div>
      </section>

      {/* Recently Uploaded Syllabi (approved only, hydrated with course info) */}
      <section
        ref={recentRef}
        className="recent-syllabi-section fade-in"
        style={{ contentVisibility: "auto", containIntrinsicSize: "540px" }}
        aria-busy={loadingRecent ? "true" : "false"}
      >
        <h2 className="scroll-title-syllabi">Recently Uploaded Syllabi</h2>
        <div className="recent-syllabi-scroll">
          {loadingRecent && recentSyllabi.length === 0
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="syllabus-card skeleton">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line long" />
                  <div className="skeleton-line shorter" />
                </div>
              ))
            : recentSyllabi.map((s) => {
                const prettyCollege = s.collegeId
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const subjectCode = s.courseDisplay.split(" ")[0] || "Course";

                return (
                  <div
                    key={`${s.collegeId}-${s.courseId}-${s.id}`}
                    className="syllabus-card plain"
                    onClick={() =>
                      navigate(
                        `/college/${s.collegeId}/subject/${subjectCode}?course=${s.courseId}`
                      )
                    }
                  >
                    <div className="sy-title">{s.courseDisplay}</div>
                    <div className="sy-subtext">{s.professor}</div>
                    <div className="sy-subtext">{prettyCollege}</div>
                    <div className="sy-time">{s.timeAgo}</div>
                  </div>
                );
              })}
        </div>
      </section>

      <section
        className="why-section fade-in"
        style={{ contentVisibility: "auto", containIntrinsicSize: "720px" }}
      >
        <img
          loading="lazy"
          src={studentImage}
          alt="Helping each other"
          className="why-img"
        />
        <div className="why-content">
          <h3>Why this matters</h3>
          <p>
            SyllabusDB lets students see real class syllabi before registering.
            When you upload one, you help others choose classes with confidence
            and make course planning easier for future students.
          </p>
          <button onClick={() => navigate("/uploadsyllabus")} className="btn">
            Upload a Syllabus
          </button>
        </div>
      </section>

      <section
        className="trust-section fade-in"
        style={{ contentVisibility: "auto", containIntrinsicSize: "680px" }}
      >
        <div className="trust-content">
          <h3>Trusted & Verified</h3>
          <p>How we keep things safe and reliable:</p>
          <ul className="trust-list">
            <p>✔️ Every syllabus is manually reviewed before approval</p>
            <p>✔️ PDF uploads are scanned with antivirus tools</p>
            <p>✔️ Most uploads are approved within 12 hours</p>
          </ul>
          <p>
            SyllabusDB is dedicated to maintaining a safe and reliable platform
            for all users.
          </p>
        </div>
        <img
          loading="lazy"
          src={verifiedImage}
          alt="Verified submission process"
          className="trust-image"
        />
      </section>
    </div>
  );
}
