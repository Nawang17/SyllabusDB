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
import { useNavigate } from "react-router";
import "./UploadSyllabusPage.css";
import { Button, Modal, Select, Textarea } from "@mantine/core";
import { getAuth, signInAnonymously } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { useDisclosure } from "@mantine/hooks";
import TermsOfService from "../Footer/TermsOfService/TermsOfService";
import GuidelinesPage from "../Footer/GuidelinesPage/GuideLinesPage";

export default function UploadSyllabus() {
  const [collegeId, setCollegeId] = useState("");
  const [colleges, setColleges] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [professor, setProfessor] = useState("");
  const [term, setTerm] = useState(getCurrentTerm());
  const [year, setYear] = useState(new Date().getFullYear());
  const [pdfFile, setPdfFile] = useState(null);

  // NEW: optional experience input
  const [experience, setExperience] = useState("");
  const EXPERIENCE_MAX = 500;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [courseOptions, setCourseOptions] = useState([]);
  const [courseSuggestions, setCourseSuggestions] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [uploadError, setUploadError] = useState(""); // error shown in modal
  const [showUploadWarning, setShowUploadWarning] = useState(() => {
    return localStorage.getItem("hideUploadWarning") !== "true";
  });
  const [TOSopened, { close: closeTOS, open: openTOS }] = useDisclosure(false);
  const [GuidelinesOpened, { close: closeG, open: openG }] =
    useDisclosure(false);

  function getCurrentTerm() {
    const m = new Date().getMonth() + 1; // 1 = Jan, 12 = Dec
    if (m === 1) return "Winter";
    if (m >= 2 && m <= 5) return "Spring";
    if (m >= 6 && m <= 8) return "Summer";
    return "Fall"; // Sep–Dec
  }

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
    setYear(new Date().getFullYear());
    setPdfFile(null);
    setUploadError("");
    setCourseSuggestions([]);
    setExperience(""); // NEW: clear optional input

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
      if (!user?.isAnonymous) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            full_name: user.displayName || "",
            profile_image: user.photoURL || "",
            createdAt: new Date(),
            wantsEmailNotifications: true,
          });
        }
      }

      if (!pdfFile || pdfFile.size > 5 * 1024 * 1024) {
        setUploadError("❌ PDF file is too large. Maximum size is 5 MB.");
        return;
      }

      const cleanedCourseCode = courseCode.trim();
      const cleanedCourseTitle = courseTitle.trim();
      const cleanedProfessor = professor.trim();

      // Clean & bound optional text
      const rawExperience = (experience || "").trim();
      const cleanedExperience =
        rawExperience.length > EXPERIENCE_MAX
          ? rawExperience.slice(0, EXPERIENCE_MAX)
          : rawExperience;

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

        // NEW: store optional experience text (omit if empty for cleanliness)
        ...(cleanedExperience ? { experience_text: cleanedExperience } : {}),
      });

      setShowReviewModal(false);
      setShowModal(true);

      // notify admin of new upload
      await fetch("https://syllabusdbserver-agza.onrender.com/notify-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeName: collegeId,
          courseCode: `${cleanedCourseCode} - ${cleanedCourseTitle}`,
          hasExperience: !!cleanedExperience,
        }),
      });
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
      {showUploadWarning && (
        <div className="upload-warning">
          <span className="warning-text">
            📌 Before uploading, please check that a syllabus for the{" "}
            <strong>same course, term, year, and professor</strong> hasn’t
            already been shared. This helps keep the platform organized and
            avoids duplicates.
          </span>
          <button
            className="dismiss-warning"
            onClick={() => {
              localStorage.setItem("hideUploadWarning", "true");
              setShowUploadWarning(false);
            }}
            aria-label="Dismiss warning"
          >
            ✕
          </button>
        </div>
      )}

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

        {/* NEW: Optional Experience Field */}
        <label>
          Class Experience (optional):
          <Textarea
            radius={"md"}
            value={experience}
            onChange={(e) => {
              const v = e.currentTarget.value;
              if (v.length <= EXPERIENCE_MAX) setExperience(v);
            }}
            placeholder="What was your experience with this class? (tips for future students, workload, grading style, etc.)"
            autosize
            minRows={3}
            maxRows={8}
            styles={{
              root: { marginTop: "0.5rem" },
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginTop: 4,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              {experience.length}/{EXPERIENCE_MAX}
            </span>
          </div>
        </label>

        <p className="upload-guideline-reminder">
          By uploading, you agree to follow our{" "}
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#2563eb",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={openG}
            aria-label="Open Community Guidelines"
          >
            Community Guidelines
          </button>{" "}
          and{" "}
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#2563eb",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={openTOS}
            aria-label="Open Terms of Service"
          >
            Terms of Service
          </button>
          . Only upload real syllabi. No private materials, personal info, or
          spam.
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

              {/* NEW: only show if provided */}
              {experience.trim() && (
                <li>
                  <strong>Experience:</strong>{" "}
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {experience.trim()}
                  </span>
                </li>
              )}
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

      {/* terms of service modal */}
      <Modal opened={TOSopened} onClose={closeTOS} title="">
        <TermsOfService ismodal={true} />
      </Modal>
      <Modal opened={GuidelinesOpened} onClose={closeG} title="">
        <GuidelinesPage ismodal={true} />
      </Modal>
    </div>
  );
}
