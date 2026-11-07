import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconThumbUp, IconThumbUpFilled } from "@tabler/icons-react";
import { auth, db } from "../../firebaseConfig";
import { toggleHelpfulVote } from "../utils/helpfulVote.js";

export default function HelpfulButton({ collegeId, courseId, syllabusId }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [count, setCount] = useState(null);
  const [helpful, setHelpful] = useState(false);
  const [ready, setReady] = useState(false);
  const [readError, setReadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const pendingRef = useRef(false);
  const path = `colleges/${collegeId}/courses/${courseId}/syllabi/${syllabusId}`;

  useEffect(() => onAuthStateChanged(auth, (current) => {
    setUser(current && !current.isAnonymous ? current : null);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    setCount(null);
    setHelpful(false);
    setReady(false);
    setReadError(false);
    const fail = (error) => {
      console.error("Could not load helpful votes:", error);
      setReadError(true);
    };
    const stopStats = onSnapshot(doc(db, `${path}/helpfulStats/total`), (snapshot) => {
      setCount(snapshot.exists() ? snapshot.data().count : 0);
    }, fail);
    const stopVote = user ? onSnapshot(doc(db, `${path}/helpfulVotes/${user.uid}`), (snapshot) => {
      setHelpful(snapshot.exists());
      setReady(true);
    }, fail) : () => {};
    return () => { stopStats(); stopVote(); };
  }, [path, user]);

  const toggle = async () => {
    if (!user) { setPromptOpen(true); return; }
    if (pendingRef.current || !ready || count === null || readError) return;
    pendingRef.current = true;
    setSaving(true);
    try {
      const current = auth.currentUser;
      if (!current || current.isAnonymous || current.uid !== user.uid) {
        setPromptOpen(true);
        return;
      }
      await runTransaction(db, (transaction) => toggleHelpfulVote(transaction, {
        syllabusRef: doc(db, path),
        voteRef: doc(db, `${path}/helpfulVotes/${current.uid}`),
        statsRef: doc(db, `${path}/helpfulStats/total`),
        createdAt: serverTimestamp(),
      }));
    } catch (error) {
      console.error("Could not save helpful vote:", error);
      notifications.show({ color: "red", title: "Couldn't save your vote", message: "Please check your connection and try again." });
    } finally {
      pendingRef.current = false;
      setSaving(false);
    }
  };

  const Icon = helpful ? IconThumbUpFilled : IconThumbUp;
  const returnTo = `${location.pathname}${location.search}`;
  return <>
    <button type="button" className={`svp-secondary svp-helpful${helpful ? " is-helpful" : ""}`} aria-pressed={helpful} aria-label={helpful ? "Remove helpful vote" : "Mark syllabus helpful"} aria-busy={saving} disabled={!authReady || saving || (!!user && (!ready || count === null || readError))} onClick={toggle} title={readError ? "Helpful votes are temporarily unavailable" : helpful ? "Tap again to undo" : "Found this syllabus useful?"}>
      <Icon size={18} aria-hidden="true" />Helpful{count !== null && !readError && <span className="svp-helpful-count">{count.toLocaleString()}</span>}
    </button>
    <Modal opened={promptOpen} onClose={() => setPromptOpen(false)} title="Found this syllabus helpful?" centered size="sm">
      <p className="svp-signin-copy">Sign in to mark this syllabus helpful. You can remove your vote anytime.</p>
      <div className="svp-signin-actions"><button type="button" className="svp-signin-later" onClick={() => setPromptOpen(false)}>Maybe later</button><Link className="svp-signin-link" to={`/signin?returnTo=${encodeURIComponent(returnTo)}`} onClick={() => setPromptOpen(false)}>Sign in</Link></div>
    </Modal>
  </>;
}
