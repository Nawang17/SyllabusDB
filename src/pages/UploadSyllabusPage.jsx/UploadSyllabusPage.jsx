import { useState, useEffect } from "react";
import { db, storage } from "../../../firebaseConfig";
import { doc, setDoc, collection, getDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router";
import "./UploadSyllabusPage.css";
import { Select } from "@mantine/core";

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
  const [showModal, setShowModal] = useState(false); // NEW
  const [courseOptions, setCourseOptions] = useState([]);
  const [courseSuggestions, setCourseSuggestions] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  useEffect(() => {
    if (courseCode.trim() === "") {
      setCourseSuggestions([]);
      return;
    }
    const filtered = courseOptions.filter((c) =>
      c.code.toLowerCase().startsWith(courseCode.toLowerCase())
    );
    setCourseSuggestions(filtered);

    const exactMatch = courseOptions.find((c) => c.code === courseCode);
    if (exactMatch) {
      setCourseTitle(exactMatch.title);
    }
  }, [courseCode, courseOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pdfFile.size > 5 * 1024 * 1024) {
      setStatus("❌ PDF file is too large. Maximum size is 5 MB.");
      return;
    }

    setStatus("Uploading...");

    try {
      const filePath = `syllabi/${collegeId}/${courseCode}/${pdfFile.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      const courseRef = doc(db, "colleges", collegeId, "courses", courseCode);
      const courseSnap = await getDoc(courseRef);
      if (!courseSnap.exists()) {
        await setDoc(courseRef, {
          code: courseCode,
          title: courseTitle,
        });
      }

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
        file_path: filePath,
        approved: false,
      });

      setShowModal(true); // SHOW MODAL
      setStatus("");
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus("❌ Upload failed.");
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload a Syllabus</h2>
      <p className="upload-warning">
        📌 Before uploading, please make sure there is not already a syllabus
        available for the <strong>same course and term</strong>. This helps
        avoid duplicates and keeps things clean for other students. Thank you!.
      </p>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          Choose College:
          <Select
            data={colleges.map((col) => ({
              value: col.id,
              label: col.name,
            }))}
            value={collegeId}
            onChange={setCollegeId}
            placeholder="Select College"
            required
            size="md"
            searchable
            style={{
              marginTop: "0.5rem",
            }}
          />
        </label>

        <label>
          Course Code (e.g. Math 150):
          <div className="course-input-wrapper">
            <input
              type="text"
              className="full-width"
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
                      setCourseCode(course.code);
                      setCourseTitle(course.title);
                      setCourseSuggestions([]);
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
          Course Title (e.g. Calculus 2):
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
          <Select
            data={["Fall", "Spring", "Summer", "Winter"].map((term) => ({
              value: term,
              label: term,
            }))}
            value={term}
            onChange={setTerm}
            placeholder="Select College"
            required
            size="md"
            searchable
            style={{
              marginTop: "0.5rem",
            }}
          />
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
          PDF File (Max 5 MB):
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

      {showModal && (
        <div className="upload-modal">
          <div className="modal-content">
            <h3>🎉 Thank you for your submission!</h3>
            <p>
              Your syllabus has been submitted and will be available on the site
              once approved.
            </p>
            <div className="modal-buttons">
              <button onClick={() => navigate("/")}>🏠 Go to Home</button>
              <button onClick={() => window.location.reload()}>
                ➕ Upload Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
