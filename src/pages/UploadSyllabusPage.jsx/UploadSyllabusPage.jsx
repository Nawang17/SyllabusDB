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
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Link, useNavigate } from "react-router";
import "./UploadSyllabusPage.css";
import { Button, Select, Text } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { getAuth, signInAnonymously } from "firebase/auth";
import { v4 as uuid } from "uuid";
function getCurrentTerm() {
  const m = new Date().getMonth() + 1; // 1 = Jan, 12 = Dec
  if (m === 1) return "Winter";
  if (m >= 2 && m <= 5) return "Spring";
  if (m >= 6 && m <= 8) return "Summer";
  return "Fall"; // Sep–Dec
}

export default function UploadSyllabus() {
  const [collegeId, setCollegeId] = useState("");
  const [colleges, setColleges] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [professor, setProfessor] = useState("");

  const [term, setTerm] = useState(getCurrentTerm());
  const [year, setYear] = useState(new Date().getFullYear());
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [courseOptions, setCourseOptions] = useState([]);
  const [courseSuggestions, setCourseSuggestions] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUploadWarning, setShowUploadWarning] = useState(() => {
    return localStorage.getItem("hideUploadWarning") !== "true";
  });
  const [status, setStatus] = useState("");

  const uploadTaskRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (performance?.getEntriesByType) {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav || nav.type === "navigate") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      const snapshot = await getDocs(collection(db, "colleges"));
      const list = snapshot.docs
        .filter((d) => d.data().approved !== false)
        .map((d) => ({ id: d.id, name: d.data().name }));
      setColleges(list);
    };
    fetchColleges();
  }, []);

  const resetForm = () => {
    setCourseCode("");
    setCourseTitle("");
    setProfessor("");
    setPdfFile(null);
    setUploadError("");
    setCourseSuggestions([]);
    setStatus("");
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (!collegeId) return;
      const courseQuery = query(
        collection(db, "colleges", collegeId, "courses"),
        where("approved", "==", true)
      );
      const courseSnap = await getDocs(courseQuery);
      const courseList = courseSnap.docs.map((d) => ({
        code: d.id,
        title: d.data().title,
      }));
      setCourseOptions(courseList);
    };
    fetchCourses();
    setCourseCode("");
    setCourseTitle("");
  }, [collegeId]);

  useEffect(() => {
    const q = courseCode.trim().toLowerCase();
    if (!q) {
      setCourseSuggestions([]);
      return;
    }
    const filtered = courseOptions.filter((c) =>
      c.code.toLowerCase().startsWith(q)
    );
    setCourseSuggestions(filtered);

    const exactMatch = courseOptions.find((c) => c.code.toLowerCase() === q);
    if (exactMatch) setCourseTitle(exactMatch.title);
  }, [courseCode, courseOptions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setUploadError("");
    setShowReviewModal(true);
  };

  // PDF validation (MIME + magic bytes)
  const validatePdf = async (file) => {
    if (!file) {
      setUploadError("Please select a PDF file.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("❌ PDF file is too large. Maximum size is 5 MB.");
      return false;
    }
    if (file.type !== "application/pdf") {
      setUploadError("File must be a PDF.");
      return false;
    }
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isPDF =
      head[0] === 0x25 &&
      head[1] === 0x50 &&
      head[2] === 0x44 &&
      head[3] === 0x46; // %PDF
    if (!isPDF) {
      setUploadError("Corrupt or non-PDF file.");
      return false;
    }
    return true;
  };

  const toSafeYear = (v) => {
    const n = Number(v || 0);
    if (Number.isNaN(n)) return new Date().getFullYear();
    return Math.min(2100, Math.max(1900, n));
  };

  const handleSubmitUpload = async () => {
    setUploadError("");
    setIsSubmitting(true);
    setStatus("Preparing upload...");

    try {
      const auth = getAuth();
      let user = auth.currentUser;
      if (!user) {
        const result = await signInAnonymously(auth);
        user = result.user;
      }
      const uid = user?.uid;
      if (!uid) throw new Error("❌ Could not authenticate. Please try again.");

      if (!user?.isAnonymous) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email || "",
            full_name: user.displayName || "",
            profile_image: user.photoURL || "",
            createdAt: serverTimestamp(),
            wantsEmailNotifications: true,
          });
        }
      }

      if (!collegeId) throw new Error("Please choose a college.");

      const ok = await validatePdf(pdfFile);
      if (!ok) return;

      const cleanedCourseCode = courseCode.trim().toUpperCase();
      const cleanedCourseTitle = courseTitle.trim();
      const cleanedProfessor = professor.replace(/\s+/g, " ").trim();
      const yr = toSafeYear(year);

      if (!cleanedCourseCode || !cleanedCourseTitle || !cleanedProfessor) {
        throw new Error("Please fill in all required fields.");
      }

      // ensure course doc exists
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
          approved: false,
        });
      }

      // duplicate check (approved or pending)
      const syllabiCol = collection(
        db,
        "colleges",
        collegeId,
        "courses",
        cleanedCourseCode,
        "syllabi"
      );
      const dupQ = query(
        syllabiCol,
        where("term", "==", term),
        where("year", "==", yr),
        where("professor_lower", "==", cleanedProfessor.toLowerCase())
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        setUploadError(
          "⚠️ A syllabus for this course, term, year, and professor already exists (pending or approved)."
        );
        return;
      }

      // upload with UUID path
      setStatus("Uploading file...");
      const id = uuid();
      const safeCode = cleanedCourseCode
        .replace(/[^\w\- ]+/g, "")
        .toUpperCase();
      const filePath = `syllabi/${collegeId}/${safeCode}/${id}.pdf`;
      const storageRef = ref(storage, filePath);
      const task = uploadBytesResumable(storageRef, pdfFile, {
        contentType: "application/pdf",
      });
      uploadTaskRef.current = task;

      await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100
            );
            setStatus(`Uploading ${pct}%`);
          },
          reject,
          resolve
        );
      });

      const pdfUrl = await getDownloadURL(task.snapshot.ref);

      await addDoc(syllabiCol, {
        professor: cleanedProfessor,
        professor_lower: cleanedProfessor.toLowerCase(),
        term,
        year: yr,
        pdf_url: pdfUrl,
        file_path: filePath,
        approved: false,
        owner: uid ?? null,
        createdAt: serverTimestamp(),
      });

      // notify admin (success only)
      fetch("https://syllabusdbserver.onrender.com/notify-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeName: collegeId,
          courseCode: `${cleanedCourseCode} - ${cleanedCourseTitle}`,
        }),
        keepalive: true,
      }).catch(() => {});

      setStatus("");
      setShowReviewModal(false);
      setShowModal(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError(err?.message || "❌ Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      uploadTaskRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      setStatus("Upload canceled.");
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
            data={colleges.map((col) => ({ value: col.id, label: col.name }))}
            value={collegeId}
            onChange={setCollegeId}
            placeholder="Select College"
            required
            size="md"
            searchable
            aria-label="Choose College"
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
              placeholder="e.g. MATH 150"
              aria-autocomplete="list"
              aria-expanded={courseSuggestions.length > 0}
              aria-controls="course-suggestions"
            />
            {courseSuggestions.length > 0 && (
              <ul
                id="course-suggestions"
                className="suggestions-dropdown"
                role="listbox"
              >
                {courseSuggestions.map((course) => (
                  <li
                    key={course.code}
                    role="option"
                    onClick={() => {
                      setCourseCode(course.code);
                      setCourseTitle(course.title);
                      setCourseSuggestions([]);
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setCourseCode(course.code);
                        setCourseTitle(course.title);
                        setCourseSuggestions([]);
                      }
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
            disabled={
              !!courseOptions.find(
                (c) => c.code.toLowerCase() === courseCode.trim().toLowerCase()
              )
            }
            placeholder="e.g. Calculus I"
          />
        </label>

        <label>
          Professor Name:
          <input
            placeholder="e.g. Jane Smith"
            type="text"
            value={professor}
            onChange={(e) =>
              setProfessor(e.target.value.replace(/\s+/g, " ").trimStart())
            }
            required
            minLength={3}
          />
        </label>

        <label>
          Term:
          <Select
            data={["Fall", "Spring", "Summer", "Winter"].map((t) => ({
              value: t,
              label: t,
            }))}
            value={term}
            onChange={setTerm}
            required
            size="md"
            style={{ marginTop: "0.5rem" }}
            aria-label="Term"
          />
        </label>

        <label>
          Year:
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            max={2100}
            min={1900}
            required
          />
        </label>

        {/* Mantine Dropzone for PDF */}
        <div className="dropzone-block">
          <Text fw={500} c="#374151">
            PDF File (Max 5 MB):
          </Text>
          <Dropzone
            onDrop={(files) => {
              setUploadError("");
              setPdfFile(files?.[0] || null);
            }}
            onReject={() =>
              setUploadError("Only PDF files up to 5 MB are allowed.")
            }
            accept={[MIME_TYPES.pdf]}
            maxSize={5 * 1024 * 1024}
            multiple={false}
            className="dropzone"
          >
            <div className="dropzone-inner">
              <Text>Drag & drop a PDF here, or click to select</Text>
              <Text size="sm" c="dimmed">
                Accepted: pdf file - up to 5 MB
              </Text>
              {pdfFile && (
                <div className="file-chip" title={pdfFile.name}>
                  {pdfFile.name}
                </div>
              )}
            </div>
          </Dropzone>
        </div>

        {status && (
          <div className="upload-status">
            {status}
            {status.startsWith("Uploading") && (
              <button
                type="button"
                className="cancel-btn"
                onClick={cancelUpload}
                aria-label="Cancel upload"
              >
                Cancel
              </button>
            )}
          </div>
        )}

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
                onClick={() => setShowReviewModal(false)}
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
