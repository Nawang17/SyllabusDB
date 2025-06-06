import { useState, useEffect, useRef } from "react";
import { db, storage } from "../../../firebaseConfig";
import {
  doc,
  setDoc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link, useNavigate } from "react-router";
import "./UploadSyllabusPage.css";
import { Button, Select } from "@mantine/core";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

export default function UploadSyllabus() {
  const [collegeId, setCollegeId] = useState("");
  const [colleges, setColleges] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [professor, setProfessor] = useState("");
  const [term, setTerm] = useState("Fall");
  const [year, setYear] = useState(new Date().getFullYear());
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [courseOptions, setCourseOptions] = useState([]);
  const [courseSuggestions, setCourseSuggestions] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [uploadError, setUploadError] = useState(""); // error shown in modal

  const fileInputRef = useRef();

  const navigate = useNavigate();
  const auth = getAuth();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Not logged in yet — sign in anonymously
        signInAnonymously(auth);
      }
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  const resetForm = () => {
    setCourseCode("");
    setCourseTitle("");
    setProfessor("");
    setTerm("Fall");
    setYear(new Date().getFullYear());
    setPdfFile(null);
    setUploadError("");
    setCourseSuggestions([]);

    // 👇 Clear file input visually
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (!collegeId) return;
      const courseQuery = query(
        collection(db, "colleges", collegeId, "courses"),
        where("approved", "==", true)
      );

      const courseSnap = await getDocs(courseQuery);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setUploadError("");
    setShowReviewModal(true); // Open confirmation modal
  };

  const handleSubmitUpload = async () => {
    setUploadError("");
    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;

      if (!uid) {
        setUploadError("❌ Please refresh and try again.");
        setIsSubmitting(false);
        return;
      }
      if (!pdfFile || pdfFile.size > 5 * 1024 * 1024) {
        setUploadError("❌ PDF file is too large. Maximum size is 5 MB.");
        return;
      }

      const filePath = `syllabi/${collegeId}/${courseCode}/${pdfFile.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      const courseRef = doc(db, "colleges", collegeId, "courses", courseCode);
      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) {
        await setDoc(courseRef, {
          code: courseCode.toUpperCase(), // Ensure code is uppercase
          title: courseTitle,
          approved: false, // Initially not approved
        });
      }
      // Step: Check if syllabus already exists for course + term + year
      const existingQuery = query(
        collection(db, "colleges", collegeId, "courses", courseCode, "syllabi"),
        where("term", "==", term),
        where("year", "==", year),
        where("professor", "==", professor),
        where("approved", "==", true) // Only check for approved syllabi
      );

      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        setUploadError(
          "⚠️ A syllabus for this course, term, and year already exists."
        );

        setIsSubmitting(false);
        return;
      }
      const sylabbiRef = collection(
        db,
        "colleges",
        collegeId,
        "courses",
        courseCode,
        "syllabi"
      );
      await setDoc(doc(sylabbiRef), {
        professor,
        term,
        year,
        pdf_url: pdfUrl,
        file_path: filePath,
        approved: false,
        owner: uid || null,
        createdAt: Timestamp.now(),
      });

      setShowReviewModal(false);
      setShowModal(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("❌ Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload a Syllabus</h2>
      <p className="upload-warning">
        📌 Before uploading, please make sure there is not already a syllabus
        available for the <strong>same course and term</strong>. This helps
        avoid duplicates and keeps things clean for other students.
      </p>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          Choose College:
          <Select
            key={collegeId}
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
            style={{ marginTop: "0.5rem" }}
          />
        </label>

        <label>
          Course Code :
          <div className="course-input-wrapper">
            <input
              type="text"
              className="full-width"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              required
              autoComplete="off"
              placeholder="e.g. MATH 150"
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
          Course Title:
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
            disabled={!!courseOptions.find((c) => c.code === courseCode)}
            placeholder="e.g. Calculus I"
          />
        </label>

        <label>
          Professor Name:
          <input
            placeholder="e.g. John Smith"
            type="text"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            required
          />
        </label>

        <label>
          Term:
          <Select
            key={term}
            data={["Fall", "Spring", "Summer", "Winter"].map((term) => ({
              value: term,
              label: term,
            }))}
            value={term}
            onChange={setTerm}
            required
            size="md"
            style={{ marginTop: "0.5rem" }}
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
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            required
          />
        </label>

        {status && <div className="upload-status">{status}</div>}
        <p className="upload-guideline-reminder">
          By uploading, you agree to follow our{" "}
          <Link to="/guidelines">community guidelines</Link>. Only upload real
          syllabi (PDF, max 5MB). No personal info or spam.
        </p>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {showModal && (
        <div className="upload-modal">
          <div className="modal-content">
            <h3>🎉 Thank you for your submission!</h3>
            <p>
              Your syllabus has been submitted and will be available on the site
              once approved.
            </p>
            <div className="modal-buttons">
              <Button color="cyan" fullWidth onClick={() => navigate("/")}>
                Go to Home
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Upload Another
              </Button>
            </div>
          </div>
        </div>
      )}
      {showReviewModal && (
        <div className="upload-modal">
          <div className="modal-content">
            <h3>📄 Confirm Your Submission</h3>

            <ul className="confirm-list">
              <li>
                <strong>College:</strong>{" "}
                {colleges.find((c) => c.id === collegeId)?.name}
              </li>
              <li>
                <strong>Course Code:</strong> {courseCode}
              </li>
              <li>
                <strong>Course Title:</strong> {courseTitle}
              </li>
              <li>
                <strong>Professor:</strong> {professor}
              </li>
              <li>
                <strong>Term:</strong> {term}
              </li>
              <li>
                <strong>Year:</strong> {year}
              </li>
              <li>
                <strong>File:</strong> {pdfFile?.name}
              </li>
            </ul>

            {uploadError && (
              <div className="upload-status error">{uploadError}</div>
            )}

            <div className="modal-buttons">
              <Button
                variant="default"
                fullWidth
                onClick={() => {
                  setShowReviewModal(false);
                }}
                disabled={isSubmitting}
              >
                Edit
              </Button>
              <Button
                color="green"
                fullWidth
                onClick={handleSubmitUpload}
                loading={isSubmitting}
              >
                Confirm & Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
