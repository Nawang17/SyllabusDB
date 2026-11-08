import { normalizeCourseCode } from "../../utils/courseCode.js";
import { Link, useParams } from "../../lib/navigation.jsx";
import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Collapse, Rating, Skeleton } from "../../components/ui/controls.jsx";
import { notifications } from "../../lib/notifications.js";
import {
  IconChevronDown,
  IconCopy,
  IconExternalLink,
  IconFileDescription,
  IconStarFilled,
} from "@tabler/icons-react";
import "./SyllabusViewerPage.css";
const HelpfulButton = lazy(() => import("../../components/HelpfulButton"));

const ratingLabels = { 1: "Rough class", 2: "Pretty tough", 3: "Manageable", 4: "Good class", 5: "Would recommend" };

export default function SyllabusViewerPage({ initialData }) {
  const { collegeId, subject, courseId, syllabusId } = useParams();
  const { syllabus, course, college } = initialData;
  const loading = false;
  const error = '';
  const [reviewOpen, setReviewOpen] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const coursePath = `/college/${encodeURIComponent(collegeId)}/subject/${encodeURIComponent(subject)}/course/${encodeURIComponent(courseId)}`;
  const courseCode = normalizeCourseCode(course?.code || courseId);
  const title = course?.title || course?.name || syllabus?.title || "Course syllabus";
  const collegeName = college?.name || collegeId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const term = [syllabus?.term, syllabus?.year].filter(Boolean).join(" ");
  const rating = Number(syllabus?.rating || 0);
  const hasRating = Number.isFinite(rating) && rating >= 1 && rating <= 5;
  const hasReview = Boolean(syllabus?.experience_text?.trim());



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
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={`/college/${encodeURIComponent(collegeId)}`}>{collegeName}</Link><span>/</span><Link to={coursePath}>{courseCode}</Link></nav>
      {loading ? (
        <div className="svp-loading" role="status" aria-label="Loading syllabus">
          <Skeleton height={32} width="45%" radius="sm" />
          <Skeleton height={20} width="65%" radius="sm" />
          <Skeleton height="65vh" radius="md" />
        </div>
      ) : error ? (
        <section className="svp-empty" role="alert"><IconFileDescription size={32} aria-hidden="true" /><h1>Syllabus unavailable</h1><p>{error}</p><button className="svp-primary" onClick={() => window.location.reload()}>Try again</button></section>
      ) : (
        <>
          <header className="svp-header">
            <div className="svp-heading">
              <h1><span className="svp-course-code">{courseCode}</span>{' · '}{title}</h1>
              <p className="svp-college"><Link to={`/college/${encodeURIComponent(collegeId)}`}>{collegeName}</Link></p>
              {(term || syllabus.professor) && <dl className="svp-details">
                {term && <div><dt>Term</dt><dd>{term}</dd></div>}
                {syllabus.professor && <div><dt>Professor</dt><dd>{syllabus.professor}</dd></div>}
              </dl>}
            </div>
            <div className="svp-actions">
              <ClientOnly><Suspense fallback={null}><HelpfulButton key={`${collegeId}/${courseId}/${syllabusId}`} collegeId={collegeId} courseId={courseId} syllabusId={syllabusId} /></Suspense></ClientOnly>
              <button type="button" className="svp-secondary" onClick={copyLink}><IconCopy size={17} aria-hidden="true" />Copy link</button>
             
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
              <div className="svp-document-toolbar"><span><IconFileDescription size={18} aria-hidden="true" />Syllabus PDF</span><a className="svp-open-pdf-mobile" href={syllabus.pdf_url} target="_blank" rel="noopener noreferrer">Open PDF in new tab<IconExternalLink size={16} aria-hidden="true" /></a></div>
              {previewError ? <div className="svp-empty" role="alert"><h2>Preview unavailable</h2><p>The document couldn't load. Please try again.</p><button type="button" className="svp-primary" onClick={() => { setPreviewError(false); setPreviewLoaded(false); setPreviewAttempt(value => value + 1); }}>Retry preview</button></div> : <div className="svp-preview" aria-busy={!previewLoaded}>
                {!previewLoaded && <p className="svp-preview-loading" role="status">Loading PDF preview...</p>}
                <iframe key={previewAttempt} src={syllabus.pdf_url} title={`${courseCode}: ${title}`} onLoad={() => setPreviewLoaded(true)} onError={() => { setPreviewLoaded(true); setPreviewError(true); }} />
              </div>}
            </section>
          )}
        </>
      )}
    </main>
  );
}
