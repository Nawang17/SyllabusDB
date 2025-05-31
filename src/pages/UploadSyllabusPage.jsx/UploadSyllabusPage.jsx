import { useState, useEffect } from "react";
import { db, storage } from "../../../firebaseConfig";
import { doc, setDoc, collection, getDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./UploadSyllabusPage.css";

export default function UploadSyllabus() {
  const [collegeId, setCollegeId] = useState("");
  const [colleges, setColleges] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [professor, setProfessor] = useState("");
  const [term, setTerm] = useState("Fall");
  const [year, setYear] = useState(new Date().getFullYear());
  const [pdfFile, setPdfFile] = useState(null);
  const [status, setStatus] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [filteredCourseOptions, setFilteredCourseOptions] = useState([]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // Load colleges
  useEffect(() => {
    const fetchColleges = async () => {
      const snapshot = await getDocs(collection(db, "colleges"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setColleges(list);
    };
    fetchColleges();
  }, []);

  // Load courses when college changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!collegeId) return;
      const courseSnap = await getDocs(
        collection(db, "colleges", collegeId, "courses")
      );
      const courseList = courseSnap.docs.map((doc) => ({
        code: doc.id,
        title: doc.data().title,
      }));
      setCourseOptions(courseList);
    };
    fetchCourses();
    setCourseCode("");
    setCourseTitle("");
  }, [collegeId]);

  // Handle course code typing
  useEffect(() => {
    const matches = courseOptions.filter((c) =>
      c.code.toLowerCase().includes(courseCode.toLowerCase())
    );
    setFilteredCourseOptions(matches);

    const exactMatch = courseOptions.find((c) => c.code === courseCode);
    if (exactMatch) {
      setCourseTitle(exactMatch.title);
    }
  }, [courseCode, courseOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Uploading...");

    try {
      // Upload file
      const storageRef = ref(
        storage,
        `syllabi/${collegeId}/${courseCode}/${pdfFile.name}`
      );
      await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      // Create course if it doesn't exist
      const courseRef = doc(db, "colleges", collegeId, "courses", courseCode);
      const courseSnap = await getDoc(courseRef);
      if (!courseSnap.exists()) {
        await setDoc(courseRef, {
          code: courseCode,
          title: courseTitle,
        });
      }

      // Upload syllabus
      const syllabiRef = collection(
        db,
        "colleges",
        collegeId,
        "courses",
        courseCode,
        "syllabi"
      );
      await setDoc(doc(syllabiRef), {
        professor,
        term,
        year,
        pdf_url: pdfUrl,
        approved: false,
      });

      setStatus("✅ Syllabus submitted for review!");
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus("❌ Upload failed.");
    }
  };
  const [courseSuggestions, setCourseSuggestions] = useState([]);
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!collegeId) return;
      const courseSnapshot = await getDocs(
        collection(db, "colleges", collegeId, "courses")
      );
      const courseList = courseSnapshot.docs.map((doc) => ({
        code: doc.id,
        ...doc.data(),
      }));
      setAllCourses(courseList);
    };
    fetchCourses();
  }, [collegeId]);

  useEffect(() => {
    if (courseCode.trim() === "") {
      setCourseSuggestions([]);
      return;
    }
    const filtered = courseOptions.filter((c) =>
      c.code.toLowerCase().startsWith(courseCode.toLowerCase())
    );
    setCourseSuggestions(filtered);
  }, [courseCode, courseOptions]);

  return (
    <div className="upload-page">
      <h2>Upload a Syllabus</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          Choose College:
          <select
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            required
          >
            <option value="">-- Select College --</option>
            {colleges.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Course Code:
          <div className="course-input-wrapper">
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              required
              autoComplete="off"
            />
            {courseSuggestions.length > 0 && (
              <ul className="suggestions-dropdown">
                {courseSuggestions.map((course) => (
                  <li
                    key={course.code}
                    onClick={() => {
                      setCourseSuggestions([]);
                      setCourseSuggestions([]);

                      setCourseCode(course.code);
                      setCourseTitle(course.title);
                    }}
                  >
                    {course.code} – {course.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </label>

        <label>
          Course Title:
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
            disabled={!!courseOptions.find((c) => c.code === courseCode)}
          />
        </label>

        <label>
          Professor Name:
          <input
            type="text"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            required
          />
        </label>

        <label>
          Term:
          <select value={term} onChange={(e) => setTerm(e.target.value)}>
            <option>Fall</option>
            <option>Spring</option>
            <option>Summer</option>
            <option>Winter</option>
          </select>
        </label>

        <label>
          Year:
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </label>

        <label>
          PDF File:
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            required
          />
        </label>

        <button type="submit">Submit</button>
      </form>

      {status && <div className="upload-status">{status}</div>}
    </div>
  );
}
