import { extractSubject } from "../../utils/courseCode.js";
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
import { Button, Flex, Image } from "@mantine/core";
import errorImage from "../../assets/5203299.jpg"; // Error image for not found
import collegeIllustration from "../../assets/college_illustration.jpg";
import { logEvent } from "firebase/analytics";


export default function CollegePage() {
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

  const [subjectMap, setSubjectMap] = useState({});
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    document.title = `SyllabusDB | ${collegeId
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")}`;
  }, [collegeId]);
  useEffect(() => {
    if (collegeId && analytics) {
      logEvent(analytics, "view_college_page", {
        college_id: collegeId,
      });
    }
  }, [collegeId]);

  useEffect(() => {
    scrollToTop();
  }, []);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let active = true;
    const fetchCollegeAndCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const collegeDocRef = doc(db, "colleges", collegeId);
        const collegeDocSnap = await getDoc(collegeDocRef);
        if (!active) return;

        if (!collegeDocSnap.exists()) {
          setError("College not found.");
          return;
        }

        const data = collegeDocSnap.data();
        setNickname(data.nickname || "");
        setCollegeImage(data.image_url || null);
        setCollegeName(data.name || "");
        setCollegeLocation([data.city, data.state].filter(Boolean).join(", "));
        setTotalSyllabiCount(data.approvedSyllabiTotal || 0);
        const courseQuery = query(
          collection(db, "colleges", collegeId, "courses"),
          where("approved", "==", true),
        );
        const courseSnapshot = await getDocs(courseQuery);
        if (!active) return;
        const courseList = courseSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(courseList);

        const grouped = {};

        for (const course of courseList) {
          const subjectCode = extractSubject(course.code);
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
        if (active) setError("We couldn't load this college. Please try again later.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCollegeAndCourses();
    return () => { active = false; };
  }, [collegeId]);

  const queryText = search.trim().toLowerCase();
  const filteredSubjects = Object.entries(subjectMap)
    .filter(([subject, data]) => subject.toLowerCase().includes(queryText) ||
      data.courses.some((course) => [course.code, course.name, course.title].some((value) => String(value || "").toLowerCase().includes(queryText))))
    .sort(([a], [b]) => a.localeCompare(b));
  const uploadPath = `/uploadsyllabus/${encodeURIComponent(collegeId)}`;

  return (
    <main className="college-page">
      {/* <Link className="cp-back" to="/colleges"><span aria-hidden="true">&larr;</span> All colleges</Link> */}
      {loading ? (
        <div className="cp-empty" role="status"><p>Loading college and subjects...</p></div>
      ) : error ? (
        <Flex className="cp-empty" gap="1rem" direction="column" align="center">
          <Image src={errorImage} alt="" w={180} h={180} />
          <h1>College unavailable</h1><p role="alert">{error}</p>
          <Button onClick={() => navigate("/colleges")}>Browse colleges</Button>
        </Flex>
      ) : (
        <>
          <header className="cp-header">
            <Image src={collegeImage || collegeIllustration} fallbackSrc={collegeIllustration} className="cp-cover" alt="" />
            <div className="cp-identity">
              <div className="cp-heading">
                <h1>{collegeName}</h1>
                {collegeLocation && <p className="cp-location"><IconMapPin size={16} aria-hidden="true" />{collegeLocation}</p>}
                {/* {nickname && nickname !== collegeName && <p className="cp-nickname">{nickname}</p>} */}
                <p className="cp-summary">
                  <span>{totalSyllabiCount.toLocaleString()} {totalSyllabiCount === 1 ? "syllabus" : "syllabi"}</span>
                  <span>{courses.length.toLocaleString()} {courses.length === 1 ? "course" : "courses"}</span>
                  <span>{Object.keys(subjectMap).length.toLocaleString()} {Object.keys(subjectMap).length === 1 ? "subject" : "subjects"}</span>
                </p>
              </div>
            </div>
            <Link className="cp-primary" to={uploadPath}>Upload a syllabus</Link>
          </header>
          <section className="cp-browse" aria-labelledby="cp-subjects-title">
            <div className="cp-browse-header">
              <div><h2 id="cp-subjects-title">Browse subjects</h2><p>Choose a subject to explore its courses and syllabi.</p></div>
              {courses.length > 0 && <input type="search" className="cp-search" aria-label="Search subjects or courses" placeholder="Search subjects or courses" value={search} onChange={(event) => setSearch(event.target.value)} />}
            </div>
            {courses.length === 0 ? (
              <div className="cp-empty"><h3>No syllabi here yet</h3><p>Share a syllabus to help students plan their classes.</p><Link className="cp-primary" to={uploadPath}>Share the first syllabus</Link></div>
            ) : filteredSubjects.length === 0 ? (
              <div className="cp-empty" role="status"><h3>No subjects found</h3><p>Try another subject code or course name.</p><button className="cp-secondary" onClick={() => setSearch("")}>Clear search</button></div>
            ) : (
              <>
                {queryText && <p className="cp-result-count" role="status">{filteredSubjects.length} {filteredSubjects.length === 1 ? "subject" : "subjects"} found</p>}
                <ul className="cp-subject-grid">
                  {filteredSubjects.map(([subject, data]) => <li key={subject}>
                    <Link className="cp-subject" to={`/college/${encodeURIComponent(collegeId)}/subject/${encodeURIComponent(subject)}`}>
                      <div><h3>{subject}</h3><p>{data.courses.length} {data.courses.length === 1 ? "course" : "courses"}<span aria-hidden="true"> · </span>{data.syllabiCount.toLocaleString()} {data.syllabiCount === 1 ? "syllabus" : "syllabi"}</p></div>
                      <IconChevronRight size={19} aria-hidden="true" />
                    </Link>
                  </li>)}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
