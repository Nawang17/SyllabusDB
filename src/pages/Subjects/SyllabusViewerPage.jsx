import { normalizeCourseCode } from "../../utils/courseCode.js";
import { Link, useParams } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Collapse, Rating, Skeleton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconChevronDown,
  IconCopy,
  IconExternalLink,
  IconFileDescription,
  IconStarFilled,
} from "@tabler/icons-react";
import { db } from "../../../firebaseConfig";
import "./SyllabusViewerPage.css";
import HelpfulButton from "../../components/HelpfulButton";

const ratingLabels = { 1: "Rough class", 2: "Pretty tough", 3: "Manageable", 4: "Good class", 5: "Would recommend" };

export default function SyllabusViewerPage() {
  const { collegeId, subject, courseId, syllabusId } = useParams();
  const [syllabus, setSyllabus] = useState(null);
  const [course, setCourse] = useState(null);
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const subjectPath = `/college/${encodeURIComponent(collegeId)}/subject/${encodeURIComponent(subject)}`;
  const coursePath = `${subjectPath}?course=${encodeURIComponent(course?.code || courseId)}`;

  useEffect(() => {
    let active = true;
    window.scrollTo(0, 0);
    setLoading(true);
    setError("");
    setReviewOpen(false);
    setPreviewLoaded(false);
    setPreviewError(false);
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          getDoc(doc(db, "colleges", collegeId, "courses", courseId, "syllabi", syllabusId)),
          getDoc(doc(db, "colleges", collegeId, "courses", courseId)),
          getDoc(doc(db, "colleges", collegeId)),
        ]);
        if (!active) return;
        const [syllabusResult, courseResult, collegeResult] = results;
        if (syllabusResult.status === "rejected") throw syllabusResult.reason;
        if (!syllabusResult.value.exists()) {
          setSyllabus(null);
          setError("This syllabus couldn't be found. It may have been removed.");
          return;
        }
        setSyllabus({ ...syllabusResult.value.data(), id: syllabusResult.value.id });
        setCourse(courseResult.status === "fulfilled" && courseResult.value.exists() ? courseResult.value.data() : null);
        setCollege(collegeResult.status === "fulfilled" && collegeResult.value.exists() ? collegeResult.value.data() : null);
      } catch (err) {
        console.error("Could not load syllabus:", err);
        if (active) setError("We couldn't load this syllabus. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [collegeId, courseId, syllabusId, retry]);

  const courseCode = normalizeCourseCode(course?.code || courseId);
  const title = course?.title || syllabus?.title || "Course syllabus";
  const collegeName = college?.name || collegeId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const term = [syllabus?.term, syllabus?.year].filter(Boolean).join(" ");
  const rating = Number(syllabus?.rating || 0);
  const hasRating = Number.isFinite(rating) && rating >= 1 && rating <= 5;
  const hasReview = Boolean(syllabus?.experience_text?.trim());

  useEffect(() => {
    document.title = `SyllabusDB | ${courseCode} Syllabus`;
  }, [courseCode]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notifications.show({ title: "Link copied", message: "Syllabus link copied to your clipboard.", color: "blue" });
    } catch {
      notifications.show({ title: "Couldn't copy link", message: "You can copy the page address from your browser.", color: "red" });
    }
  };

  return (
    <main className="syllabus-viewer-page">
      <Link className="svp-back" to={coursePath}><IconArrowLeft size={18} aria-hidden="true" />Back to {subject.toUpperCase()} courses</Link>
      {loading ? (
        <div className="svp-loading" role="status" aria-label="Loading syllabus">
          <Skeleton height={32} width="45%" radius="sm" />
          <Skeleton height={20} width="65%" radius="sm" />
          <Skeleton height="65vh" radius="md" />
        </div>
      ) : error ? (
        <section className="svp-empty" role="alert"><IconFileDescription size={32} aria-hidden="true" /><h1>Syllabus unavailable</h1><p>{error}</p><button className="svp-primary" onClick={() => setRetry((value) => value + 1)}>Try again</button></section>
      ) : (
        <>
          <header className="svp-header">
            <div className="svp-heading">
              <p className="svp-course-code">{courseCode}</p>
              <h1>{title}</h1>
              <p className="svp-college"><Link to={`/college/${encodeURIComponent(collegeId)}`}>{collegeName}</Link></p>
              {(term || syllabus.professor) && <dl className="svp-details">
                {term && <div><dt>Term</dt><dd>{term}</dd></div>}
                {syllabus.professor && <div><dt>Professor</dt><dd>{syllabus.professor}</dd></div>}
              </dl>}
            </div>
            <div className="svp-actions">
              <HelpfulButton key={`${collegeId}/${courseId}/${syllabusId}`} collegeId={collegeId} courseId={courseId} syllabusId={syllabusId} />
              <button type="button" className="svp-secondary" onClick={copyLink}><IconCopy size={17} aria-hidden="true" />Copy link</button>
              {syllabus.pdf_url && <a className="svp-primary" href={syllabus.pdf_url} target="_blank" rel="noopener noreferrer"><IconExternalLink size={17} aria-hidden="true" />Open PDF</a>}
            </div>
          </header>

          {(hasRating || hasReview) && <section className="svp-review" aria-label="Student review">
            <div className="svp-review-header">
              <div className="svp-review-summary"><IconStarFilled size={18} aria-hidden="true" /><h2>Student review</h2>{hasRating && <span>{rating}/5<span className="svp-rating-label"> &middot; {ratingLabels[Math.round(rating)]}</span></span>}</div>
              {hasReview && <button type="button" className="svp-review-toggle" aria-expanded={reviewOpen} aria-controls="svp-review-text" onClick={() => setReviewOpen((value) => !value)}>{reviewOpen ? "Hide review" : "Read review"}<IconChevronDown size={17} className={reviewOpen ? "is-open" : ""} aria-hidden="true" /></button>}
            </div>
            {hasReview && <Collapse in={reviewOpen}><div className="svp-review-content" id="svp-review-text">{hasRating && <Rating value={rating} readOnly size="sm" aria-label={`${rating} out of 5 stars`} />}<p>{syllabus.experience_text}</p></div></Collapse>}
          </section>}

          {!syllabus.pdf_url ? (
            <section className="svp-empty"><IconFileDescription size={32} aria-hidden="true" /><h2>PDF unavailable</h2><p>The document isn't available for this syllabus.</p><Link className="svp-secondary" to={coursePath}>Browse other syllabi</Link></section>
          ) : (
            <section className="svp-document" aria-label="Syllabus document">
              <div className="svp-document-toolbar"><span><IconFileDescription size={18} aria-hidden="true" />Syllabus PDF</span><a href={syllabus.pdf_url} target="_blank" rel="noopener noreferrer">Open in new tab<IconExternalLink size={15} aria-hidden="true" /></a></div>
              <div className="svp-mobile-note">For easier reading on your phone, use <a href={syllabus.pdf_url} target="_blank" rel="noopener noreferrer">Open PDF</a>.</div>
              {previewError ? <div className="svp-empty" role="alert"><h2>Preview unavailable</h2><p>Open the PDF in a new tab to read it.</p><a className="svp-primary" href={syllabus.pdf_url} target="_blank" rel="noopener noreferrer">Open PDF<IconExternalLink size={17} aria-hidden="true" /></a></div> : <div className="svp-preview" aria-busy={!previewLoaded}>
                {!previewLoaded && <p className="svp-preview-loading" role="status">Loading PDF preview...</p>}
                <iframe src={syllabus.pdf_url} title={`${courseCode}: ${title}`} onLoad={() => setPreviewLoaded(true)} onError={() => { setPreviewLoaded(true); setPreviewError(true); }} />
              </div>}
            </section>
          )}
        </>
      )}
    </main>
  );
}
