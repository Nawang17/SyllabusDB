import { useEffect, useRef, useState } from "react";
import { Link } from "../../lib/navigation.jsx";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { IconArrowLeft, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { db } from "../../../firebaseConfig";
import { generateCollegeId } from "../../utils/adminCollegeEdit.js";
import { validateCollegeRequest, createCollegeRequest } from "../../utils/collegeRequest.js";
import "./RequestCollege.css";

const emptyDraft = { name: "", city: "", state: "" };

export default function RequestCollege() {
  const [draft, setDraft] = useState(emptyDraft);
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [duplicate, setDuplicate] = useState(null);
  const pendingRef = useRef(false);
  const nameRef = useRef(null);
  const successRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    document.title = "SyllabusDB | Request a College";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  useEffect(() => {
    if (error || duplicate) errorRef.current?.focus();
  }, [error, duplicate]);

  const updateField = (field, value) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: "" }));
    setError("");
    setDuplicate(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pendingRef.current) return;
    setError("");
    setDuplicate(null);
    const { details, errors } = validateCollegeRequest(draft);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() => document.getElementById(`request-college-${Object.keys(errors)[0]}`)?.focus());
      return;
    }
    pendingRef.current = true;
    setSubmitting(true);
    try {
      const auth = getAuth();
      await auth.authStateReady();
      let user = auth.currentUser;
      if (!user) user = (await signInAnonymously(auth)).user;
      const id = generateCollegeId(details.name);
      const collegeRef = doc(db, "colleges", id);
      const result = await runTransaction(db, (transaction) => createCollegeRequest(transaction, collegeRef, details, {
        owner: user?.uid, createdAt: serverTimestamp(),
      }));
      if (!result.created) {
        setDuplicate({ id, approved: result.approved });
        return;
      }
      setSubmitted(details);
      // Notification delivery must not turn a saved request into a failed form.
      void fetch("https://syllabusdbserver-agza.onrender.com/notify-college-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeName: details.name, location: `${details.city}, ${details.state}` }),
        keepalive: true,
      }).catch((notificationError) => console.error("Request saved; notification failed:", notificationError));
    } catch (submitError) {
      console.error("Error submitting college request:", submitError);
      setError("We couldn't submit your request. Your details are still here. Please try again.");
    } finally {
      pendingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <main className="request-college-page">
      {/* <Link className="request-back-link" to="/colleges"><IconArrowLeft size={16} aria-hidden="true" />All colleges</Link> */}
      <section className="request-card" aria-labelledby="request-college-heading">
        {submitted ? (
          <div className="request-success">
            <div className="request-success-icon" aria-hidden="true"><IconCheck size={28} /></div>
            <h1 id="request-college-heading" ref={successRef} tabIndex={-1}>Request submitted</h1>
            <p>We'll review your college before publishing.</p>
            <div className="request-submitted-details"><strong>{submitted.name}</strong><span>{submitted.city}, {submitted.state}</span></div>
            <div className="request-success-actions">
              <Link className="request-primary" to="/colleges">Browse colleges</Link>
              <button className="request-secondary" onClick={() => {
                setSubmitted(null); setDraft(emptyDraft); setError(""); setFieldErrors({}); setDuplicate(null);
                requestAnimationFrame(() => nameRef.current?.focus());
              }}>Request another</button>
            </div>
          </div>
        ) : (
          <>
            <header className="request-header"><h1 id="request-college-heading">Request a college</h1><p>We'll review it before adding it to SyllabusDB.</p></header>
            <form className="request-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
              {(error || duplicate) && <div className="request-error" role="alert" ref={errorRef} tabIndex={-1}>
                {error || (duplicate.approved ? "This college is already listed." : "This college is already awaiting review.")}
                {duplicate?.approved && <Link to={`/college/${encodeURIComponent(duplicate.id)}`}>View college</Link>}
              </div>}
              <fieldset disabled={submitting}>
                <div className="request-field">
                  <label htmlFor="request-college-name">College name <span aria-hidden="true">*</span></label>
                  <input ref={nameRef} id="request-college-name" name="collegeName" autoComplete="organization" value={draft.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Boston University" required aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "request-name-error" : undefined} />
                  {fieldErrors.name && <span className="request-field-error" id="request-name-error">{fieldErrors.name}</span>}
                </div>
                <div className="request-location-row">
                  <div className="request-field">
                    <label htmlFor="request-college-city">City <span aria-hidden="true">*</span></label>
                    <input id="request-college-city" name="city" autoComplete="address-level2" value={draft.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Boston" required aria-invalid={!!fieldErrors.city} aria-describedby={fieldErrors.city ? "request-city-error" : undefined} />
                    {fieldErrors.city && <span className="request-field-error" id="request-city-error">{fieldErrors.city}</span>}
                  </div>
                  <div className="request-field">
                    <label htmlFor="request-college-state">State / region <span aria-hidden="true">*</span></label>
                    <input id="request-college-state" name="state" autoComplete="address-level1" value={draft.state} onChange={(event) => updateField("state", event.target.value)} placeholder="Massachusetts" required aria-invalid={!!fieldErrors.state} aria-describedby={fieldErrors.state ? "request-state-error" : undefined} />
                    {fieldErrors.state && <span className="request-field-error" id="request-state-error">{fieldErrors.state}</span>}
                  </div>
                </div>
              </fieldset>
              <button className="request-primary" type="submit" disabled={submitting}>
                {submitting && <IconLoader2 size={18} className="request-spinner" aria-hidden="true" />}
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
