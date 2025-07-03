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
import { getAuth, signInAnonymously } from "firebase/auth";
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      const snapshot = await getDocs(collection(db, "colleges"));
      const list = snapshot.docs
        .filter((doc) => doc.data().approved !== false) // ✅ filter out unapproved
        .map((doc) => ({
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

      // ✅ Check login status and sign in anonymously if not logged in
      let user = auth.currentUser;
      if (!user) {
        const result = await signInAnonymously(auth);
        user = result.user;
      }

      const uid = user?.uid;
      if (!uid) {
        setUploadError("❌ Could not authenticate. Please try again.");
        setIsSubmitting(false);
        return;
      }
      if (!pdfFile || pdfFile.size > 5 * 1024 * 1024) {
        setUploadError("❌ PDF file is too large. Maximum size is 5 MB.");
        return;
      }
      const cleanedCourseCode = courseCode.trim();
      const cleanedCourseTitle = courseTitle.trim();
      const cleanedProfessor = professor.trim();

      const filePath = `syllabi/${collegeId}/${cleanedCourseCode}/${pdfFile.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      const courseRef = doc(
        db,
        "colleges",
        collegeId,
        "courses",
        cleanedCourseCode
      );
      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) {
        await setDoc(courseRef, {
          code: cleanedCourseCode,
          title: cleanedCourseTitle,
          approved: false, // Initially not approved
        });
      }
      // Step: Check if syllabus already exists for course + term + year
      const existingQuery = query(
        collection(
          db,
          "colleges",
          collegeId,
          "courses",
          cleanedCourseCode,
          "syllabi"
        ),
        where("term", "==", term),
        where("year", "==", year),
        where("professor", "==", cleanedProfessor),
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
        cleanedCourseCode,
        "syllabi"
      );
      await setDoc(doc(sylabbiRef), {
        professor: cleanedProfessor,
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
      // Notify admin about the new upload
      await fetch("https://syllabusdbserver.onrender.com/notify-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collegeName: collegeId,
          courseCode: courseCode,
        }),
      });
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload a Syllabus</h2>
      <p className="upload-warning">
        📌 Before uploading, please check that a syllabus for the{" "}
        <strong>same course, term, year, and professor</strong> hasn’t already
        been shared. This helps keep the platform organized and avoids
        duplicates.
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
              value={courseCode.toUpperCase()}
              onChange={(e) =>
                setCourseCode(e.target.value.toUpperCase().trimStart())
              }
              required
              autoComplete="off"
              placeholder="e.g. Math 150"
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
            onChange={(e) => setCourseTitle(e.target.value.trimStart())}
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
            onChange={(e) => setProfessor(e.target.value.trimStart())}
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
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= 4) {
                setYear(val);
              }
            }}
            max={9999}
            min={1000}
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
          <Link to="/guidelines">Community Guidelines</Link> and{" "}
          <Link to="/termsofservice">Terms of Service</Link>. Only upload real
          syllabi. No private materials, personal info, or spam.
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
                <strong>Course Code:</strong> {courseCode.trim()}
              </li>
              <li>
                <strong>Course Title:</strong> {courseTitle.trim()}
              </li>
              <li>
                <strong>Professor:</strong> {professor.trim()}
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
