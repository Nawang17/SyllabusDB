import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Link, useLocation, useNavigate } from "react-router";
import { getAuth, GoogleAuthProvider, isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup } from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { IconArrowLeft, IconCheck, IconMail, IconMailOpened } from "@tabler/icons-react";
import { safeSignInReturn } from "../utils/signInReturn.js";
import "./sign-in.css";

function signInError(error) {
  switch (error.code) {
    case "auth/popup-closed-by-user": return "The sign-in window was closed. You can try again whenever you're ready.";
    case "auth/popup-blocked": return "Your browser blocked the sign-in window. Allow popups for this site or use an email link.";
    case "auth/network-request-failed": return "Couldn't connect. Check your connection and try again.";
    case "auth/invalid-email": return "Enter a valid email address.";
    case "auth/expired-action-code":
    case "auth/invalid-action-code": return "This sign-in link has expired or was already used. Request a new link below.";
    case "auth/invalid-credential": return "Check that this is the email address the link was sent to, or request a new link.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a little before trying again.";
    case "auth/user-disabled": return "This account is unavailable. Contact support if you need help.";
    default: return "Couldn't sign in. Please try again or use another sign-in option.";
  }
}

export default function SignIn() {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeSignInReturn(new URLSearchParams(location.search).get("returnTo"));
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [emailLinkMode, setEmailLinkMode] = useState(() => isSignInWithEmailLink(auth, window.location.href));
  const operationRef = useRef(false);
  const attemptedLinkRef = useRef(false);
  const successRef = useRef(null);

  useEffect(() => {
    document.title = "SyllabusDB | Sign in";
    window.scrollTo(0, 0);
    return onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous && !operationRef.current) navigate(returnTo, { replace: true });
    });
  }, [auth, navigate, returnTo]);

  useEffect(() => {
    if (sentTo) successRef.current?.focus();
  }, [sentTo]);

  const finishSignIn = useCallback(async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        await setDoc(userRef, {
          email: user.email || "",
          full_name: user.displayName || "",
          profile_image: user.photoURL || "",
          createdAt: serverTimestamp(),
          wantsEmailNotifications: true,
        });
        void fetch("https://syllabusdbserver-agza.onrender.com/notify-newUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "new user" }),
          keepalive: true,
        }).catch((err) => console.error("Signed in; notification failed:", err));
      }
    } catch (err) {
      // Authentication already succeeded; profile setup must not report a failed sign-in.
      console.error("Signed in; profile setup failed:", err);
    }
    notifications.show({ title: "Signed in", message: "Welcome to SyllabusDB!", color: "blue", icon: <IconCheck size={16} /> });
    navigate(returnTo, { replace: true });
  }, [db, navigate, returnTo]);

  const completeEmailSignIn = useCallback(async (address) => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy("complete");
    setError("");
    try {
      const result = await signInWithEmailLink(auth, address.trim(), window.location.href);
      try { localStorage.removeItem("emailForSignIn"); } catch { /* Storage is optional. */ }
      await finishSignIn(result.user);
    } catch (err) {
      console.error("Email sign-in failed:", err);
      setError(signInError(err));
    } finally {
      operationRef.current = false;
      setBusy("");
    }
  }, [auth, finishSignIn]);

  useEffect(() => {
    if (!emailLinkMode || attemptedLinkRef.current) return;
    attemptedLinkRef.current = true;
    let savedEmail;
    try { savedEmail = localStorage.getItem("emailForSignIn"); } catch { /* Ask for the email inline. */ }
    if (savedEmail) {
      setEmail(savedEmail);
      void completeEmailSignIn(savedEmail);
    }
  }, [emailLinkMode, completeEmailSignIn]);

  const handleGoogleSignIn = async () => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy("google");
    setError("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await finishSignIn(result.user);
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(signInError(err));
    } finally {
      operationRef.current = false;
      setBusy("");
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (operationRef.current) return;
    const address = email.trim();
    if (emailLinkMode) { await completeEmailSignIn(address); return; }
    operationRef.current = true;
    setBusy("send");
    setError("");
    try {
      await sendSignInLinkToEmail(auth, address, {
        url: `${window.location.origin}/signin?returnTo=${encodeURIComponent(returnTo)}`,
        handleCodeInApp: true,
      });
      try { localStorage.setItem("emailForSignIn", address); } catch { /* Email confirmation works without storage. */ }
      setSentTo(address);
    } catch (err) {
      console.error("Could not send sign-in link:", err);
      setError(err.code === "auth/invalid-email" || err.code === "auth/too-many-requests" || err.code === "auth/network-request-failed" ? signInError(err) : "Couldn't send the email. Please try again or sign in with Google.");
    } finally {
      operationRef.current = false;
      setBusy("");
    }
  };

  const requestNewLink = () => {
    setEmailLinkMode(false);
    setSentTo("");
    setError("");
    navigate(`/signin?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
  };

  return (
    <main className="sign-in-page">
      <div className="signin-wrap">
        {/* <Link className="signin-back" to={returnTo === "/" ? "/colleges" : returnTo}><IconArrowLeft size={18} aria-hidden="true" />{returnTo === "/" ? "Browse colleges" : "Back to where you left off"}</Link> */}
        <section className="signin-card" aria-labelledby="signin-title">
          <header className="signin-header"><h1 id="signin-title">{emailLinkMode ? "Finish signing in" : sentTo ? "Check your inbox" : "Sign in to SyllabusDB"}</h1><p>{emailLinkMode ? "Confirm the email address we sent your link to." : sentTo ? "Your sign-in link is on its way." : "Manage your uploads, share reviews, and mark useful syllabi helpful."}</p></header>
          {error && <p className="signin-error" role="alert">{error}</p>}
          {sentTo ? <div className="signin-sent">
            <IconMailOpened size={32} aria-hidden="true" />
            <p ref={successRef} tabIndex={-1} role="status">We sent a sign-in link to <strong>{sentTo}</strong>.</p>
            <p>Open the link in your email to continue. If it doesn't arrive, check your spam folder.</p>
            <button className="signin-text-button" type="button" onClick={() => { setSentTo(""); setError(""); }}>Use another email or resend</button>
          </div> : <>
            {!emailLinkMode && <>
              <Button className="signin-google" fullWidth variant="default" size="md" radius="md" onClick={handleGoogleSignIn} loading={busy === "google"} disabled={!!busy} leftSection={<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width="18" height="18" />}>Continue with Google</Button>
              <div className="signin-divider"><span>or use your email</span></div>
            </>}
            <form onSubmit={handleEmailSubmit} className="signin-form" aria-busy={!!busy}>
              <label htmlFor="signin-email">Email address</label>
              <div className="signin-email-field"><IconMail size={18} aria-hidden="true" /><input id="signin-email" type="email" name="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@example.com" disabled={!!busy} aria-invalid={!!error} aria-describedby="signin-email-hint" /></div>
              <p id="signin-email-hint" className="signin-hint">{emailLinkMode ? "Use the same address you entered when requesting the link." : "We'll send you a sign-in link. No password needed."}</p>
              <Button type="submit" fullWidth size="md" radius="md" color="#1e88e5" loading={busy === "send" || busy === "complete"} disabled={!!busy}>{emailLinkMode ? "Confirm and sign in" : "Send sign-in link"}</Button>
            </form>
            {emailLinkMode && <button type="button" className="signin-text-button" onClick={requestNewLink} disabled={!!busy}>Request a new link</button>}
          </>}
          <p className="signin-policy">By signing in, you agree to our <Link to="/termsofservice">Terms of Service</Link>. Read how we handle your information in our <Link to="/privacy-policy">Privacy Policy</Link>.</p>
        </section>
        <p className="signin-browse">Just exploring? <Link to="/">Browse without signing in</Link></p>
      </div>
    </main>
  );
}