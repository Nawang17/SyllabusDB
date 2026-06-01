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
import { useNavigate, useParams } from "react-router";
import "./UploadSyllabusPage.css";
import {
  Button,
  Modal,
  Rating,
  Select,
  Textarea,
  Progress,
} from "@mantine/core";
import { getAuth, signInAnonymously } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { useDisclosure } from "@mantine/hooks";
import TermsOfService from "../Footer/TermsOfService/TermsOfService";
import GuidelinesPage from "../Footer/GuidelinesPage/GuideLinesPage";
import { IconFile } from "@tabler/icons-react";

export default function UploadSyllabus() {
  const auth = getAuth();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsSignedIn(!!user && !user.isAnonymous);
    });

    return unsubscribe;
  }, []);
  const { collegeName } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [collegeId, setCollegeId] = useState(collegeName || "");
  const [colleges, setColleges] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [professor, setProfessor] = useState("");
  const [term, setTerm] = useState(getCurrentTerm());
  const [year, setYear] = useState(new Date().getFullYear());
  const [pdfFile, setPdfFile] = useState(null);

  const [rating, setRating] = useState(0);
  const [experience, setExperience] = useState("");
  const EXPERIENCE_MAX = 500;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [courseOptions, setCourseOptions] = useState([]);
  const [courseSuggestions, setCourseSuggestions] = useState([]);

  const [showUploadWarning, setShowUploadWarning] = useState(() => {
    return localStorage.getItem("hideUploadWarning") !== "true";
  });
  const isMobile = window.innerWidth <= 768;
  const [TOSopened, { close: closeTOS, open: openTOS }] = useDisclosure(false);
  const [GuidelinesOpened, { close: closeG, open: openG }] =
    useDisclosure(false);

  useEffect(() => {
    document.title = "SyllabusDB | Upload a Syllabus";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      const snapshot = await getDocs(collection(db, "colleges"));

      const list = snapshot.docs
        .filter((doc) => doc.data().approved !== false)
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setColleges(list);
    };

    fetchColleges();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!collegeId) return;

      const courseQuery = query(
        collection(db, "colleges", collegeId, "courses"),
        where("approved", "==", true),
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
    setCourseSuggestions([]);
  }, [collegeId]);

  useEffect(() => {
    if (courseCode.trim() === "") {
      setCourseSuggestions([]);
      return;
    }

    const filtered = courseOptions.filter((c) =>
      c.code.toLowerCase().startsWith(courseCode.toLowerCase()),
    );

    setCourseSuggestions(filtered);

    const exactMatch = courseOptions.find((c) => c.code === courseCode);
    if (exactMatch) {
      setCourseTitle(exactMatch.title);
    }
  }, [courseCode, courseOptions]);

  function getCurrentTerm() {
    const m = new Date().getMonth() + 1;
    if (m === 1) return "Winter";
    if (m >= 2 && m <= 5) return "Spring";
    if (m >= 6 && m <= 8) return "Summer";
    return "Fall";
  }

  function normalizeCourseCode(input) {
    if (!input) return "";

    let cleaned = input.trim().toUpperCase();
    cleaned = cleaned.replace(/\s+/g, "");

    const match = cleaned.match(/^([A-Z]+)([0-9]+[A-Z]?)$/);

    if (!match) return cleaned;

    const [, subject, number] = match;
    return `${subject} ${number}`;
  }

  const selectedCollegeName =
    colleges.find((college) => college.id === collegeId)?.name || "";

  const ratingLabel = {
    0: "No rating yet",
    1: "Rough class",
    2: "Pretty tough",
    3: "Manageable",
    4: "Good class",
    5: "Would recommend",
  };

  const resetForm = () => {
    setCourseCode("");
    setCourseTitle("");
    setProfessor("");
    setTerm(getCurrentTerm());
    setYear(new Date().getFullYear());
    setPdfFile(null);
    setRating(0);
    setExperience("");
    setUploadError("");
    setCourseSuggestions([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (file) => {
    setUploadError("");

    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("PDF file is too large. Maximum size is 5 MB.");
      return;
    }

    setPdfFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUploadError("");

    if (!pdfFile) {
      setUploadError("Please upload a syllabus PDF.");
      return;
    }

    setShowReviewModal(true);
  };

  const handleSubmitUpload = async () => {
    setUploadError("");
    setIsSubmitting(true);

    try {
      let user = auth.currentUser;

      if (!user) {
        const result = await signInAnonymously(auth);
        user = result.user;
      }

      const uid = user?.uid;

      if (!uid) {
        setUploadError("Could not authenticate. Please try again.");
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
        setUploadError("PDF file is too large. Maximum size is 5 MB.");
        setIsSubmitting(false);
        return;
      }

      const cleanedCourseCode = normalizeCourseCode(courseCode);
      const cleanedCourseTitle = courseTitle.trim();
      const cleanedProfessor = professor.trim();

      const rawExperience = experience.trim();
      const cleanedExperience =
        rawExperience.length > EXPERIENCE_MAX
          ? rawExperience.slice(0, EXPERIENCE_MAX)
          : rawExperience;

      const filePath = `syllabi/${collegeId}/${cleanedCourseCode}/${Date.now()}-${pdfFile.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      const courseRef = doc(
        db,
        "colleges",
        collegeId,
        "courses",
        cleanedCourseCode,
      );

      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) {
        await setDoc(courseRef, {
          code: cleanedCourseCode,
          title: cleanedCourseTitle,
          approved: false,
        });
      }

      const existingQuery = query(
        collection(
          db,
          "colleges",
          collegeId,
          "courses",
          cleanedCourseCode,
          "syllabi",
        ),
        where("term", "==", term),
        where("year", "==", Number(year)),
        where("professor", "==", cleanedProfessor),
        where("approved", "==", true),
      );

      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        setUploadError(
          "A syllabus for this course, term, year, and professor already exists.",
        );
        setIsSubmitting(false);
        return;
      }

      const syllabusRef = collection(
        db,
        "colleges",
        collegeId,
        "courses",
        cleanedCourseCode,
        "syllabi",
      );

      await setDoc(doc(syllabusRef), {
        professor: cleanedProfessor,
        term,
        year: Number(year),
        pdf_url: pdfUrl,
        file_path: filePath,
        approved: false,
        owner: uid || null,
        createdAt: Timestamp.now(),
        rating: rating || null,
        ...(cleanedExperience ? { experience_text: cleanedExperience } : {}),
      });

      await fetch("https://syllabusdbserver-agza.onrender.com/notify-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collegeName: collegeId,
          courseCode: `${cleanedCourseCode} - ${cleanedCourseTitle}`,
          hasExperience: !!cleanedExperience,
        }),
      });

      setShowReviewModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-page">
      <section className="upload-hero">
        <h1>Upload a Syllabus</h1>
      </section>

      {/* {showUploadWarning && (
        <div className="upload-warning">
          <span className="warning-text">
            📌 Before uploading, please check that the same course, term, year,
            and professor has not already been shared to avoid duplicates.
          </span>

          <button
            className="dismiss-warning"
            onClick={() => {
              localStorage.setItem("hideUploadWarning", "true");
              setShowUploadWarning(false);
            }}
            aria-label="Dismiss warning"
            type="button"
          >
            ✕
          </button>
        </div>
      )} */}
      {!isSignedIn && (
        <div className="signin-reminder">
          <p>
            👋 Looks like you're not signed in. Sign in to track uploads, edit
            reviews, and receive email updates.
          </p>

          <Button
            variant="light"
            size={"xs"}
            onClick={() => navigate("/signin")}
          >
            Sign In
          </Button>
        </div>
      )}
      <div className="upload-layout">
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-header">
              <span>1</span>
              <div>
                <h2>Class details</h2>
              </div>
            </div>

            <label>
              Choose College
              <Select
                data={colleges.map((col) => ({
                  value: col.id,
                  label: col.name,
                }))}
                value={collegeId}
                onChange={setCollegeId}
                placeholder="Search for your college"
                required
                size="md"
                searchable
                nothingFoundMessage="No college found"
              />
            </label>

            <label>
              Course Code
              <div className="course-input-wrapper">
                <input
                  type="text"
                  className="full-width"
                  value={courseCode.toUpperCase()}
                  onChange={(e) =>
                    setCourseCode(e.target.value.toUpperCase().trimStart())
                  }
                  onBlur={() => setCourseCode(normalizeCourseCode(courseCode))}
                  required
                  autoComplete="off"
                  placeholder="e.g. CSCI 127"
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
                        <strong>{course.code}</strong>
                        <span>{course.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>

            <label>
              Course Title
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value.trimStart())}
                required
                disabled={!!courseOptions.find((c) => c.code === courseCode)}
                placeholder="e.g. Introduction to Computer Science"
              />
            </label>

            <label>
              Professor Name
              <input
                placeholder="e.g. Jane Smith"
                type="text"
                value={professor}
                onChange={(e) => setProfessor(e.target.value.trimStart())}
                required
              />
            </label>

            <div className="two-column-fields">
              <label>
                Term
                <Select
                  data={["Fall", "Spring", "Summer", "Winter"].map((item) => ({
                    value: item,
                    label: item,
                  }))}
                  value={term}
                  onChange={setTerm}
                  required
                  size="md"
                />
              </label>

              <label>
                Year
                <input
                  type="number"
                  value={year}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 4) setYear(val);
                  }}
                  max={9999}
                  min={1000}
                  required
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <span>2</span>
              <div>
                <h2>Upload PDF</h2>
                <p>One syllabus PDF. Max 5 MB.</p>
              </div>
            </div>

            <label className={`file-drop-card ${pdfFile ? "has-file" : ""}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                hidden
              />

              <div className="file-icon">
                <IconFile size={48} color="#64748b" />
              </div>

              {pdfFile ? (
                <>
                  <strong>{pdfFile.name}</strong>
                  <span>
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB selected
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <strong>Click to upload your syllabus</strong>
                  <span>PDF only, max 5 MB</span>
                </>
              )}
            </label>
          </div>

          <div className="form-section review-section">
            <div className="form-section-header">
              <span>3</span>
              <div>
                <h2>Optional student review</h2>
              </div>
            </div>

            <div className="student-review-card">
              <div>
                <h3>Help the next student survive this class 👀</h3>
                <p>
                  Rate your overall class experience. Think workload, grading,
                  clarity, professor style, and whether you would recommend it.
                </p>
              </div>

              <div className="rating-box">
                <Rating value={rating} onChange={setRating} size="xl" />
                <span>{ratingLabel[rating]}</span>
              </div>
            </div>

            <label>
              Quick Class Review
              <Textarea
                radius="md"
                value={experience}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  if (value.length <= EXPERIENCE_MAX) setExperience(value);
                }}
                placeholder="Drop the real tea: workload, exams, grading, attendance, professor style, and tips you wish you knew before taking it."
                autosize
                minRows={4}
                maxRows={8}
              />
              <div className="character-row">
                <span>Keep it helpful, not hateful.</span>
                <span>
                  {experience.length}/{EXPERIENCE_MAX}
                </span>
              </div>
            </label>
          </div>

          {uploadError && (
            <div className="upload-status error">{uploadError}</div>
          )}

          <p className="upload-guideline-reminder">
            By uploading, you agree to follow our{" "}
            <button type="button" onClick={openG}>
              Community Guidelines
            </button>{" "}
            and{" "}
            <button type="button" onClick={openTOS}>
              Terms of Service
            </button>
            . Only upload real syllabi. No private materials, personal info, or
            spam.
          </p>

          <Button
            type="submit"
            size="lg"
            radius="xl"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Review Upload
          </Button>
        </form>
      </div>

      {showSuccessModal && (
        <div className="upload-modal">
          <div className="modal-content success-modal">
            <div className="success-emoji">🎉</div>

            <h3>Syllabus submitted!</h3>

            <p>
              Your syllabus is now waiting for approval. Once approved, students
              will be able to find it on SyllabusDB.
            </p>

            <div className="modal-buttons">
              <Button
                color="green"
                fullWidth
                onClick={() => {
                  setShowSuccessModal(false);
                  resetForm();
                }}
              >
                Upload Another
              </Button>

              <Button
                color="gray"
                variant="subtle"
                fullWidth
                onClick={() => navigate("/")}
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="upload-modal">
          <div className="modal-content">
            <h3>Confirm your upload</h3>

            <p className="confirm-subtext">
              Quick check before this goes to the approval queue.
            </p>

            <ul className="confirm-list">
              <li>
                <strong>College:</strong> {selectedCollegeName}
              </li>
              <li>
                <strong>Course Code:</strong> {normalizeCourseCode(courseCode)}
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
              {rating > 0 && (
                <li>
                  <strong>Rating:</strong> {rating}/5, {ratingLabel[rating]}
                </li>
              )}
              {experience.trim() && (
                <li>
                  <strong>Review:</strong>{" "}
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

      <Modal opened={TOSopened} onClose={closeTOS} title="">
        <TermsOfService ismodal />
      </Modal>

      <Modal opened={GuidelinesOpened} onClose={closeG} title="">
        <GuidelinesPage ismodal />
      </Modal>
    </div>
  );
}
