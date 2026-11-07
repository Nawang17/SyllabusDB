import { useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Avatar, Skeleton, Switch } from "@mantine/core";
import { Link } from "react-router";
import { IconBell, IconCheck, IconChevronRight, IconLogout, IconShieldLock, IconUser } from "@tabler/icons-react";
import { db } from "../../../../../firebaseConfig";
import "./Settings.css";

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "Not available";
}

export default function SettingsPage() {
  const auth = getAuth();
  const [authResolved, setAuthResolved] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const saveRef = useRef(null);

  useEffect(() => {
    document.title = "SyllabusDB | Settings";
    window.scrollTo(0, 0);
    return onAuthStateChanged(auth, (current) => {
      saveRef.current = null;
      setSaving(false);
      setSaveStatus("");
      setSaveError("");
      setLoadError("");
      setEnabled(false);
      setProfileExists(false);
      setAuthUser(current && !current.isAnonymous ? current : null);
      setAuthResolved(true);
      setLoading(!!current && !current.isAnonymous);
    });
  }, [auth]);

  useEffect(() => {
    if (!authUser) return;
    let active = true;
    setLoading(true);
    setLoadError("");
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", authUser.uid));
        if (!active) return;
        setProfileExists(snapshot.exists());
        setEnabled(snapshot.data()?.wantsEmailNotifications === true);
      } catch (error) {
        console.error("Could not load settings:", error);
        if (active) setLoadError("We couldn't load your notification preferences. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [authUser, retry]);

  const handleToggle = async (checked) => {
    if (!authUser || saveRef.current || loadError || auth.currentUser?.uid !== authUser.uid) return;
    const operation = {};
    saveRef.current = operation;
    const previous = enabled;
    setEnabled(checked);
    setSaving(true);
    setSaveStatus("");
    setSaveError("");
    try {
      await setDoc(doc(db, "users", authUser.uid), {
        ...(!profileExists ? {
          email: authUser.email || "",
          full_name: authUser.displayName || "",
          profile_image: authUser.photoURL || "",
          createdAt: serverTimestamp(),
        } : {}),
        wantsEmailNotifications: checked,
      }, { merge: true });
      if (saveRef.current !== operation) return;
      setProfileExists(true);
      setSaveStatus("Changes saved");
    } catch (error) {
      console.error("Could not save settings:", error);
      if (saveRef.current !== operation) return;
      setEnabled(previous);
      setSaveError("Couldn't save this change. Your previous preference is still selected. Please try again.");
    } finally {
      if (saveRef.current === operation) {
        saveRef.current = null;
        setSaving(false);
      }
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setSaveError("");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Could not sign out:", error);
      setSaveError("Couldn't sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const providers = [...new Set((authUser?.providerData || []).map(({ providerId }) => providerId === "google.com" ? "Google" : providerId === "password" ? "Email" : providerId))].join(", ");

  return (
    <main className="settings-page">
      <header className="settings-header"><h1>Settings</h1><p>Manage your account and submission notifications.</p></header>
      {!authResolved ? (
        <div className="settings-grid" role="status" aria-label="Loading settings"><Skeleton height={270} radius="md" /><Skeleton height={270} radius="md" /></div>
      ) : !authUser ? (
        <section className="settings-empty"><IconUser size={32} aria-hidden="true" /><h2>Sign in to manage your settings</h2><p>Choose whether to receive submission updates and view your account details.</p><Link className="settings-primary" to="/signin?returnTo=%2Fsettings">Sign in</Link></section>
      ) : (
        <div className="settings-grid">
          <div className="settings-main">
            <section className="settings-card" aria-labelledby="notification-heading">
              <div className="settings-section-title"><IconBell size={20} aria-hidden="true" /><h2 id="notification-heading">Email notifications</h2></div>
              {loading ? <div className="settings-loading" role="status" aria-label="Loading preferences"><Skeleton height={20} width="70%" /><Skeleton height={48} /></div> : loadError ? <div className="settings-error" role="alert"><p>{loadError}</p><button className="settings-secondary" onClick={() => setRetry((value) => value + 1)}>Try again</button></div> : <>
                <Switch className="settings-toggle" size="md" checked={enabled} onChange={(event) => handleToggle(event.currentTarget.checked)} label="Submission updates" description="Email me when my syllabus or college request is approved or rejected." disabled={saving || signingOut} />
                <p className="settings-note">Updates go to <strong>{authUser.email || "your account email"}</strong> from <strong>no-reply@syllabusdb.com</strong>. You can change this preference anytime.</p>
                <div className="settings-save-status" role="status" aria-live="polite">{saving ? "Saving changes..." : saveStatus ? <><IconCheck size={16} aria-hidden="true" />{saveStatus}</> : "Changes save automatically."}</div>
              </>}
            </section>
            <section className="settings-card" aria-labelledby="privacy-heading">
              <div className="settings-section-title"><IconShieldLock size={20} aria-hidden="true" /><h2 id="privacy-heading">Privacy &amp; your data</h2></div>
              <p className="settings-description">Your published syllabi and reviews are public. You can manage your contributions in My uploads.</p>
              <div className="settings-links"><Link to="/myuploads">Manage my uploads<IconChevronRight size={16} aria-hidden="true" /></Link><Link to="/privacy-policy">Read the privacy policy<IconChevronRight size={16} aria-hidden="true" /></Link><Link to="/takedown">Request content removal<IconChevronRight size={16} aria-hidden="true" /></Link></div>
              <p className="settings-note">For account data or deletion requests, email <a href="mailto:katophh@gmail.com?subject=Account%20data%20request">katophh@gmail.com</a> from your account email.</p>
            </section>
          </div>
          <section className="settings-card settings-account" aria-labelledby="account-heading">
            <div className="settings-section-title"><IconUser size={20} aria-hidden="true" /><h2 id="account-heading">Your account</h2></div>
            <div className="settings-profile"><Avatar src={authUser.photoURL} alt="" size={48} radius="xl">{(authUser.displayName || authUser.email || "U")[0].toUpperCase()}</Avatar><div><p className="settings-name">{authUser.displayName || "SyllabusDB account"}</p><p className="settings-email">{authUser.email}</p></div></div>
            <dl className="settings-details">{providers && <div><dt>Sign-in method</dt><dd>{providers}</dd></div>}<div><dt>Member since</dt><dd>{formatDate(authUser.metadata.creationTime)}</dd></div></dl>
            <p className="settings-note">Signing out keeps your published contributions on SyllabusDB.</p>
            <button type="button" className="settings-secondary settings-signout" onClick={handleSignOut} disabled={signingOut || saving}><IconLogout size={17} aria-hidden="true" />{signingOut ? "Signing out..." : "Sign out"}</button>
          </section>
        </div>
      )}
      {saveError && <p className="settings-feedback-error" role="alert">{saveError}</p>}
    </main>
  );
}