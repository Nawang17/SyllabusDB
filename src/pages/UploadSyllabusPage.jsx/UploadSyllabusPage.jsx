import { syllabusFileError, syllabusDetailsError } from "../../utils/uploadValidation.js";
import { normalizeCourseCode } from "../../utils/courseCode.js";
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
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router";
import "./UploadSyllabusPage.css";
import {
  Autocomplete,
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
  }, [auth]);
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
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [collegeLoadError, setCollegeLoadError] = useState("");
  const [courseLoadError, setCourseLoadError] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [reloadColleges, setReloadColleges] = useState(0);
  const [reloadCourses, setReloadCourses] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [TOSopened, { close: closeTOS, open: openTOS }] = useDisclosure(false);
  const [GuidelinesOpened, { close: closeG, open: openG }] =
    useDisclosure(false);

  useEffect(() => {
    document.title = "SyllabusDB | Upload a Syllabus";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingColleges(true);
    setCollegeLoadError("");
    getDocs(collection(db, "colleges")).then((snapshot) => {
      if (!active) return;
      setColleges(snapshot.docs.filter((item) => item.data().approved !== false)
        .map((item) => ({ id: item.id, name: item.data().name || item.id }))
        .sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => {
      if (active) setCollegeLoadError("Couldn't load colleges.");
    }).finally(() => { if (active) setLoadingColleges(false); });
    return () => { active = false; };
  }, [reloadColleges]);

  useEffect(() => {
    setCourseCode("");
    setCourseTitle("");
  }, [collegeId]);

  useEffect(() => {
    setCourseOptions([]);
    setCourseLoadError("");
    if (!collegeId) { setLoadingCourses(false); return; }
    let active = true;
    setLoadingCourses(true);
    getDocs(query(collection(db, "colleges", collegeId, "courses"), where("approved", "==", true)))
      .then((snapshot) => {
        if (active) setCourseOptions(snapshot.docs.map((item) => ({ code: item.id, title: item.data().title || "" })));
      }).catch(() => {
        if (active) setCourseLoadError("Course suggestions are unavailable. You can still enter a course.");
      }).finally(() => { if (active) setLoadingCourses(false); });
    return () => { active = false; };
  }, [collegeId, reloadCourses]);

  const existingCourse = courseOptions.find((course) => normalizeCourseCode(course.code) === normalizeCourseCode(courseCode));
  useEffect(() => {
    if (existingCourse) setCourseTitle(existingCourse.title);
  }, [existingCourse]);

  function getCurrentTerm() {
    const m = new Date().getMonth() + 1;
    if (m === 1) return "Winter";
    if (m >= 2 && m <= 5) return "Spring";
    if (m >= 6 && m <= 8) return "Summer";
    return "Fall";
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;
    const error = syllabusFileError(file);
    setUploadError(error);
    setPdfFile(error ? null : file);
    if (error && fileInputRef.current) fileInputRef.current.value = "";
  };

  const detailsError = () => syllabusDetailsError({ collegeId, courseCode, courseTitle, professor, term, year });
  const handleSubmit = (event) => {
    event.preventDefault();
    const error = detailsError() || (selectedCollegeName ? "" : "Choose an available college.") || syllabusFileError(pdfFile);
    setUploadError(error);
    if (!error) setShowReviewModal(true);
  };

  const handleSubmitUpload = async () => {
    if (isSubmitting) return;
    const validationError = detailsError() || syllabusFileError(pdfFile);
    if (validationError) { setUploadError(validationError); return; }
    setUploadError("");
    setUploadProgress(0);
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

      const cleanedCourseCode = normalizeCourseCode(courseCode);
      const cleanedCourseTitle = courseTitle.trim();
      const cleanedProfessor = professor.trim();

      const rawExperience = experience.trim();
      const cleanedExperience =
        rawExperience.length > EXPERIENCE_MAX
          ? rawExperience.slice(0, EXPERIENCE_MAX)
          : rawExperience;

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

      const filePath = `syllabi/${collegeId}/${cleanedCourseCode}/${Date.now()}-${pdfFile.name}`;
      const storageRef = ref(storage, filePath);

      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, pdfFile);
        task.on("state_changed", (snapshot) => {
          setUploadProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100));
        }, reject, resolve);
      });
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

      // A notification failure must not report a successfully saved upload as failed.
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
      }).catch((error) => console.error("Upload saved; notification failed:", error));

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
    <main className="upload-page">
      <header className="upload-hero"><h1>Upload a syllabus</h1><p>Share a PDF. Help the next student.</p></header>
      {!isSignedIn && <div className="upload-signin"><span>Want to manage your uploads?</span><Button variant="subtle" color="#1e88e5" onClick={() => navigate("/signin")}>Sign in</Button></div>}
      <form className="upload-form" onSubmit={handleSubmit}>
        <fieldset className="upload-fields" disabled={isSubmitting}>
          <section className="upload-section" aria-labelledby="class-details-title">
            <h2 id="class-details-title"><span className="upload-step">1</span>Class details</h2>
            <Select
              label="College" required searchable size="md" radius="md"
              data={colleges.map((college) => ({ value: college.id, label: college.name }))}
              value={collegeId || null} onChange={setCollegeId}
              placeholder={loadingColleges ? "Loading colleges..." : "Find your college"}
              nothingFoundMessage="No college found" disabled={loadingColleges || !!collegeLoadError}
            />
            {collegeLoadError && <div className="upload-inline-error" role="alert">{collegeLoadError}<button type="button" onClick={() => setReloadColleges((value) => value + 1)}>Try again</button></div>}
            {!loadingColleges && !collegeLoadError && <button type="button" className="upload-text-link upload-request" onClick={() => navigate("/requestcollege")}>College missing? Request it</button>}
            <div className="upload-course-grid">
              <Autocomplete
                label="Course code" required size="md" radius="md"
                placeholder="e.g. CSCI 12700"
                value={courseCode}
                onChange={(value) => setCourseCode(value.toUpperCase().trimStart())}
                onBlur={() => setCourseCode(normalizeCourseCode(courseCode))}
                data={courseOptions.map((course) => course.code)}
                filter={({ options, search }) => options.filter((option) => normalizeCourseCode(option.value).startsWith(normalizeCourseCode(search))).slice(0, 8)}
                renderOption={({ option }) => <div className="upload-course-option"><strong>{normalizeCourseCode(option.value)}</strong><span>{courseOptions.find((course) => course.code === option.value)?.title}</span></div>}
                disabled={!collegeId} maxDropdownHeight={240}
              />
              <div className="upload-native-field">
                <label htmlFor="upload-course-title">Course name <span aria-hidden="true">*</span></label>
                <input className="upload-text-input" id="upload-course-title" type="text" value={courseTitle} onChange={(event) => setCourseTitle(event.target.value.trimStart())} required readOnly={!!existingCourse?.title} placeholder="e.g. Introduction to Computer Science" />
              </div>
            </div>
            {loadingCourses && <p className="upload-field-note" role="status">Loading course suggestions...</p>}
            {courseLoadError && <div className="upload-inline-error" role="alert">{courseLoadError}<button type="button" onClick={() => setReloadCourses((value) => value + 1)}>Try again</button></div>}
            <div className="upload-native-field">
              <label htmlFor="upload-professor">Professor <span aria-hidden="true">*</span></label>
              <input className="upload-text-input" id="upload-professor" type="text" value={professor} onChange={(event) => setProfessor(event.target.value.trimStart())} required placeholder="e.g. Jane Smith" />
            </div>
            <div className="upload-two-columns">
              <Select label="Term" required data={["Fall", "Spring", "Summer", "Winter"]} value={term} onChange={setTerm} allowDeselect={false} size="md" radius="md" />
              <div className="upload-native-field">
                <label htmlFor="upload-year">Year <span aria-hidden="true">*</span></label>
                <input className="upload-text-input" id="upload-year" type="number" inputMode="numeric" value={year} onChange={(event) => { if (event.target.value.length <= 4) setYear(event.target.value); }} min={1000} max={9999} step={1} required />
              </div>
            </div>
          </section>

          <section className="upload-section" aria-labelledby="upload-pdf-title">
            <h2 id="upload-pdf-title"><span className="upload-step">2</span>Syllabus PDF</h2>
            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={(event) => handleFileChange(event.target.files?.[0])} hidden />
            <button
              type="button" className={`upload-dropzone${dragging ? " is-dragging" : ""}${pdfFile ? " has-file" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault(); setDragging(false);
                if (event.dataTransfer.files.length !== 1) { setUploadError("Choose one syllabus PDF at a time."); return; }
                handleFileChange(event.dataTransfer.files[0]);
              }}
              aria-label={pdfFile ? `Replace selected PDF: ${pdfFile.name}` : "Choose a syllabus PDF, maximum 5 MB"}
            >
              <IconFile size={32} aria-hidden="true" />
              <strong>{pdfFile ? pdfFile.name : "Choose a PDF or drop it here"}</strong>
              <span>{pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB - click to replace` : "PDF only, up to 5 MB"}</span>
            </button>
            {pdfFile && <div className="upload-file-actions"><span role="status">PDF selected</span><button type="button" className="upload-text-link" onClick={() => { setPdfFile(null); setUploadError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Remove file</button></div>}
          </section>

          <details className="upload-section upload-review">
            <summary>Add a student review <span>Optional</span></summary>
            <div className="upload-review-content">
              <div className="upload-rating"><Rating value={rating} onChange={setRating} size="lg" aria-label="Rate your class experience" /><span>{ratingLabel[rating]}</span>{rating > 0 && <button type="button" className="upload-text-link" onClick={() => setRating(0)}>Clear</button>}</div>
              <Textarea label="Your experience" value={experience} onChange={(event) => setExperience(event.currentTarget.value.slice(0, EXPERIENCE_MAX))} placeholder="Workload, grading, or advice for future students." autosize minRows={3} maxRows={7} maxLength={EXPERIENCE_MAX} radius="md" />
              <span className="upload-character-count">{experience.length}/{EXPERIENCE_MAX}</span>
            </div>
          </details>
        </fieldset>
        {uploadError && <div className="upload-error" role="alert">{uploadError}</div>}
        <p className="upload-terms">By uploading, you agree to our <button type="button" onClick={openG}>Guidelines</button> and <button type="button" onClick={openTOS}>Terms of Service</button>.</p>
        <Button type="submit" color="#1e88e5" size="md" radius="md" fullWidth disabled={isSubmitting || loadingColleges || !!collegeLoadError}>Review upload</Button>
      </form>

      <Modal opened={showReviewModal} onClose={() => !isSubmitting && setShowReviewModal(false)} title="Review your upload" centered size="lg" closeOnClickOutside={!isSubmitting} closeOnEscape={!isSubmitting} withCloseButton={!isSubmitting} classNames={{ body: "upload-dialog", title: "upload-dialog-title" }}>
        <dl className="upload-summary">
          <div><dt>College</dt><dd>{selectedCollegeName}</dd></div>
          <div><dt>Course</dt><dd>{normalizeCourseCode(courseCode)}<span>{courseTitle.trim()}</span></dd></div>
          <div><dt>Professor</dt><dd>{professor.trim()}</dd></div>
          <div><dt>Term</dt><dd>{term} {year}</dd></div>
          <div><dt>PDF</dt><dd>{pdfFile?.name}</dd></div>
          {rating > 0 && <div><dt>Rating</dt><dd>{rating}/5</dd></div>}
          {experience.trim() && <div><dt>Review</dt><dd className="upload-review-text">{experience.trim()}</dd></div>}
        </dl>
        {uploadError && <div className="upload-error" role="alert">{uploadError}</div>}
        {isSubmitting && <div className="upload-progress" role="status"><Progress value={uploadProgress} color="#1e88e5" aria-label="PDF upload progress" /><p>{uploadProgress === 100 ? "Saving your upload..." : `Uploading PDF: ${uploadProgress}%`}</p></div>}
        <p className="upload-dialog-note">Your syllabus will be reviewed before publishing.</p>
        <div className="upload-dialog-actions"><Button variant="default" disabled={isSubmitting} onClick={() => setShowReviewModal(false)}>Back to edit</Button><Button color="#1e88e5" onClick={handleSubmitUpload} loading={isSubmitting}>Submit syllabus</Button></div>
      </Modal>
      <Modal opened={showSuccessModal} onClose={() => { setShowSuccessModal(false); resetForm(); }} title="Syllabus submitted" centered classNames={{ body: "upload-dialog", title: "upload-dialog-title" }}>
        <p className="upload-success-copy">Thanks for sharing. Your syllabus is waiting for approval.</p>
        <div className="upload-dialog-actions"><Button variant="default" onClick={() => navigate("/")}>Go home</Button><Button color="#1e88e5" onClick={() => { setShowSuccessModal(false); resetForm(); }}>Upload another</Button></div>
      </Modal>
      <Modal opened={TOSopened} onClose={closeTOS} title="Terms of Service" size="lg"><TermsOfService ismodal /></Modal>
      <Modal opened={GuidelinesOpened} onClose={closeG} title="Community Guidelines" size="lg"><GuidelinesPage ismodal /></Modal>
    </main>
  );
}
