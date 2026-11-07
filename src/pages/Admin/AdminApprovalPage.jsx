import { useEffect, useState } from "react";
import { db, storage, auth } from "../../../firebaseConfig";
import {
  collectionGroup,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  increment,
  setDoc,
  serverTimestamp,
  runTransaction,
  getDocsFromServer,
  limit,
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import "./AdminApprovalPage.css";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";
import { Button, Modal, TextInput, Select, Alert } from "@mantine/core";
import { normalizeCourseCode } from "../../utils/courseCode.js";
import { COURSE_TERMS, validateSyllabusEdit, applyPendingSyllabusEdit, cleanupEmptySourceCourse } from "../../utils/adminSyllabusEdit.js";
const allowedAdminEmail = "nawangsherpa1010@gmail.com"; //
export default function AdminApprovalPage() {
  useEffect(() => {
    document.title = "SyllabusDB | Admin";
  }, []);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ courseCode: "", courseTitle: "", year: "", term: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [notice, setNotice] = useState("");
  const [pageError, setPageError] = useState("");
  const [busyItems, setBusyItems] = useState({});

  const performAction = async (key, action) => {
    setBusyItems((previous) => ({ ...previous, [key]: true }));
    setPageError("");
    try {
      await action();
    } catch (error) {
      setPageError(error.message || "The action failed. Please try again.");
    } finally {
      setBusyItems((previous) => ({ ...previous, [key]: false }));
    }
  };

  const openEditor = (syllabus) => {
    setEditError("");
    setEditing(syllabus);
    setDraft({ courseCode: normalizeCourseCode(syllabus.courseId), courseTitle: syllabus.courseTitle, year: String(syllabus.year ?? ""), term: syllabus.term || "" });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setEditError("");
    setSaving(true);
    try {
      const edit = validateSyllabusEdit(draft);
      const course = doc(db, "colleges", editing.collegeId, "courses", edit.courseCode);
      const destination = doc(course, "syllabi", editing.id);
      await runTransaction(db, (transaction) => applyPendingSyllabusEdit(transaction, {
        source: editing.ref, destination, course,
      }, edit));
      setSyllabi((previous) => previous.map((item) => {
        if (item.ref.path === editing.ref.path) {
          return { ...item, ref: destination, courseId: edit.courseCode, courseTitle: edit.courseTitle, year: edit.year, term: edit.term };
        }
        if (item.collegeId === editing.collegeId && item.courseId === edit.courseCode) {
          return { ...item, courseTitle: edit.courseTitle };
        }
        return item;
      }));
      setEditing(null);
      setNotice("Upload details saved. Review the updated information before approving.");
      try {
        await cleanupEmptySourceCourse(editing.ref, destination, {
          hasSyllabi: async (sourceCourse) => {
            const remaining = await getDocsFromServer(query(
              collection(sourceCourse, "syllabi"), limit(1),
            ));
            return !remaining.empty;
          },
          deleteCourse: (sourceCourse) => deleteDoc(sourceCourse),
        });
      } catch {
        // The edit already committed; cleanup failure must not suggest retrying
        // the move, or obscure that the details were successfully saved.
        setPageError("Upload details were saved, but the old course could not be checked or cleaned up. It has been left in place.");
      }
    } catch (error) {
      setEditError(error.message || "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const [scanResults, setScanResults] = useState({});
  const [scanningIds, setScanningIds] = useState({});
  const [openColleges, setOpenColleges] = useState({});
  const [openOwners, setOpenOwners] = useState({});
  const toggleCollege = (college) => {
    setOpenColleges((prev) => ({ ...prev, [college]: !prev[college] }));
  };
  const [collegeRequests, setCollegeRequests] = useState([]);
  const [showCollegeRequests, setShowCollegeRequests] = useState(false);

  const toggleOwner = (college, owner) => {
    const key = `${college}__${owner}`;
    setOpenOwners((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const shouldNotifyUser = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return null;

      const data = userSnap.data();
      if (data.email && data.wantsEmailNotifications) {
        return data.email;
      }
      return null;
    } catch (err) {
      console.error("Error checking notification preferences:", err);
      return null;
    }
  };
  const sendNotificationEmail = async ({ email, subject, message }) => {
    try {
      await fetch("https://syllabusdbserver-agza.onrender.com/notify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, message }),
      });
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  };
  const approveCollege = async (id) => {
    if (!window.confirm("Are you sure you want to approve this college?"))
      return;

    const collegeRef = doc(db, "colleges", id);
    const collegeSnap = await getDoc(collegeRef);
    const data = collegeSnap.data();

    await updateDoc(collegeRef, { approved: true });
    setCollegeRequests((prev) => prev.filter((c) => c.id !== id));

    const email = await shouldNotifyUser(data.owner);
    if (email) {
      await sendNotificationEmail({
        email,
        subject: `Your college request for ${data.name} was approved`,
        message:
          `Hi,\n\n` +
          `Good news! Your request to add "${data.name}" has been approved and is now live on SyllabusDB.\n\n` +
          `Thank you for helping grow the platform and making it more useful for everyone.` +
          `\n\nBest regards,\n` +
          `The SyllabusDB Team`,
      });
    }
  };
  const deleteCollege = async (id) => {
    const reason = window.prompt(
      "Enter a reason for disapproval (this will be emailed):",
    );
    if (!reason) return;

    if (!window.confirm("Are you sure you want to delete this college?"))
      return;

    const collegeRef = doc(db, "colleges", id);
    const collegeSnap = await getDoc(collegeRef);
    const data = collegeSnap.data();

    await deleteDoc(collegeRef);
    setCollegeRequests((prev) => prev.filter((c) => c.id !== id));

    const email = await shouldNotifyUser(data.owner);
    if (email) {
      await sendNotificationEmail({
        email,
        subject: `Your college request for ${data.name} was disapproved`,
        message:
          `Hi,\n\n` +
          `We reviewed your request to add "${data.name}" to SyllabusDB, but it was not approved at this time.\n\n` +
          `Reason: ${reason}\n\n` +
          `If you have any questions or believe this was a mistake, please reach out to us.\n\n` +
          `Thank you for your understanding.` +
          `\n\nBest regards,\n` +
          `The SyllabusDB Team`,
      });
    }
  };

  const navigate = useNavigate();
  const scanPDF = async (syllabus) => {
    const { pdf_url } = syllabus;
    const id = syllabus.ref.path;

    setScanningIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(
        `https://syllabusdbserver-agza.onrender.com/scan?url=${encodeURIComponent(
          pdf_url,
        )}`,
      );
      const data = await res.json();
      setScanResults((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error("Scan failed:", err);
      setScanResults((prev) => ({
        ...prev,
        [id]: { error: "Scan failed. Try again." },
      }));
    } finally {
      setScanningIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      if (!currUser || currUser.email !== allowedAdminEmail) {
        navigate("/login");
      } else {
        Promise.all([fetchUnapprovedSyllabi(), fetchUnapprovedColleges()])
          .catch((error) => setPageError(error.message || "Could not load pending requests."))
          .finally(() => setLoading(false));
      }
    });

    return () => unsubscribe();
  }, [navigate]);
  const fetchUnapprovedColleges = async () => {
    const q = query(collection(db, "colleges"), where("approved", "==", false));
    const snapshot = await getDocs(q);

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setCollegeRequests(requests);
  };

  const groupedByCollege = syllabi.reduce((acc, item) => {
    const college = item.collegeName;
    const owner = item.owner || "Unknown";

    if (!acc[college]) acc[college] = {};
    if (!acc[college][owner]) acc[college][owner] = [];

    acc[college][owner].push(item);
    return acc;
  }, {});

  const fetchUnapprovedSyllabi = async () => {
    setLoading(true);

    const q = query(
      collectionGroup(db, "syllabi"),
      where("approved", "==", false),
    );
    const snapshot = await getDocs(q);

    const unapproved = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (!data.approved) {
        const { term, year, professor, pdf_url, file_path, createdAt, owner } =
          data;

        // Extract college and course from path
        const pathParts = docSnap.ref.path.split("/");
        const collegeId = pathParts[1];
        const courseId = pathParts[3];

        const collegeSnap = await getDoc(doc(db, "colleges", collegeId));
        const courseSnap = await getDoc(
          doc(db, "colleges", collegeId, "courses", courseId),
        );

        const collegeName = collegeSnap.exists()
          ? collegeSnap.data().name
          : collegeId;
        const courseTitle = courseSnap.exists() ? courseSnap.data().title : "";

        unapproved.push({
          id: docSnap.id,
          ref: docSnap.ref,
          term,
          year,
          professor,
          pdf_url,
          collegeId,
          collegeName,
          courseId,
          courseTitle,
          file_path,
          createdAt: createdAt?.toDate?.() || null,
          owner,
          experience_text: data.experience_text || "",
          rating: data.rating || null,
        });
      }
    }

    setSyllabi(unapproved);
    // Sort by createdAt (newest first)
    const sorted = unapproved.sort((a, b) => {
      const timeA = a.createdAt?.getTime?.() || 0;
      const timeB = b.createdAt?.getTime?.() || 0;
      return timeB - timeA;
    });

    setSyllabi(sorted);

    setLoading(false);
  };

  const approveSyllabus = async (ref, collegeId, courseId, owner) => {
    if (!window.confirm("Are you sure you want to approve this syllabus?"))
      return;

    await updateDoc(ref, { approved: true });

    const courseRef = doc(db, "colleges", collegeId, "courses", courseId);
    await updateDoc(courseRef, {
      approved: true,
      approvedSyllabiCount: increment(1),
    });
    const collegeRef = doc(db, "colleges", collegeId);
    await updateDoc(collegeRef, {
      approvedSyllabiTotal: increment(1),
    });

    await setDoc(
      doc(db, "stats", "global"),
      {
        total_syllabi: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    setSyllabi((prev) => prev.filter((s) => s.ref.path !== ref.path));

    const email = await shouldNotifyUser(owner);
    if (email) {
      await sendNotificationEmail({
        email,
        subject: `Your syllabus for ${courseId} was approved`,
        message:
          `Hi there,\n\n` +
          `Your syllabus for ${courseId} at ${collegeId} has been approved.\n\n` +
          `It's now available for others to view on SyllabusDB.\n\n` +
          `Thank you for contributing and helping other students make better choices!\n\n` +
          `Best regards,\n` +
          `The SyllabusDB Team`,
      });
    }
  };

  const disapproveSyllabus = async (syllabus) => {
    const reason = window.prompt(
      "Enter a reason for disapproval (this will be emailed):",
    );
    if (!reason) return;

    if (
      !window.confirm(
        "Are you sure you want to disapprove and delete this syllabus?",
      )
    )
      return;

    try {
      await deleteObject(storageRef(storage, syllabus.file_path));
      await deleteDoc(
        doc(
          db,
          "colleges",
          syllabus.collegeId,
          "courses",
          syllabus.courseId,
          "syllabi",
          syllabus.id,
        ),
      );
      // after deleting the syllabus
      const syllabiRef = collection(
        db,
        "colleges",
        syllabus.collegeId,
        "courses",
        syllabus.courseId,
        "syllabi",
      );
      const remaining = await getDocs(syllabiRef);

      if (remaining.empty) {
        await deleteDoc(
          doc(db, "colleges", syllabus.collegeId, "courses", syllabus.courseId),
        );
      }
      const email = await shouldNotifyUser(syllabus.owner);
      if (email) {
        await sendNotificationEmail({
          email,
          subject: `Your syllabus for ${syllabus.courseId} was disapproved`,
          message:
            `Hi,\n\n` +
            `Unfortunately, your syllabus for ${syllabus.courseId} at ${syllabus.collegeId} was not approved.\n\n` +
            `Reason: ${reason}\n\n` +
            `If you believe this was a mistake or have questions, feel free to reach out.\n\n` +
            `Best regards,\n` +
            `The SyllabusDB Team`,
        });
      }

      fetchUnapprovedSyllabi();
    } catch (err) {
      console.error("Failed to disapprove/delete syllabus:", err);
      alert("❌ Failed to delete syllabus.");
    }
  };

  return (
    <div className="admin-approval-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">SYLLABUSDB ADMIN</p>
      </div>
        <span className="admin-pending-count">{syllabi.length} pending uploads</span>
      </header>
      {notice && <Alert color="green" withCloseButton onClose={() => setNotice("")} role="status">{notice}</Alert>}
      {pageError && <Alert color="red" role="alert">{pageError}</Alert>}
      {loading ? (
        <p>Loading...</p>
      ) : syllabi.length === 0 ? (
        <p>No pending syllabi.</p>
      ) : (
        <>
          <div className="syllabus-list">
            {/* <h3>Total Pending: {syllabi.length}</h3> */}

            {Object.entries(groupedByCollege).map(([college, owners]) => (
              <div key={college} className="college-group">
                <button
                  onClick={() => toggleCollege(college)}
                  aria-expanded={!!openColleges[college]}
                  className="dropdown-btn"
                >
                  {openColleges[college] ? "▼" : "►"} 🏫 {college} (
                  {Object.values(owners).flat().length})
                </button>

                {openColleges[college] &&
                  Object.entries(owners).map(([owner, items]) => {
                    const key = `${college}__${owner}`;
                    return (
                      <div key={key} className="owner-group">
                        <button
                          onClick={() => toggleOwner(college, owner)}
                          aria-expanded={!!openOwners[key]}
                          className="dropdown-btn inner"
                        >
                          {openOwners[key] ? "▼" : "►"} 👤 {owner.slice(0, 23)}
                          ... ({items.length})
                        </button>

                        {openOwners[key] &&
                          items.map((s) => (
                            <div className="syllabus-card" key={s.ref.path}>
                              <div className="syllabus-info">
                                {s.createdAt && (
                                  <div>
                                    📅 Uploaded: {s.createdAt.toLocaleString()}
                                  </div>
                                )}
                                <strong>
                                  {s.term} {s.year}
                                </strong>{" "}
                                – {s.professor}
                                <br />
                                📚 <strong>{normalizeCourseCode(s.courseId)}</strong>:{" "}
                                {s.courseTitle}
                                <br />
                                {s.experience_text && (
                                  <>
                                    <strong>Experience:</strong>{" "}
                                    {s.experience_text}
                                  </>
                                )}
                                <br />
                                {s.rating && (
                                  <>
                                    <strong>Rating:</strong> {s.rating}/5
                                  </>
                                )}
                              </div>
                              <div className="syllabus-actions">
                                <button className="admin-edit-button" disabled={busyItems[s.ref.path]} onClick={() => openEditor(s)}>Edit details</button>
                                <a
                                  href={s.pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View PDF
                                </a>
                                <button
                                  className="admin-scan-button"
                                  onClick={() => scanPDF(s)}
                                  disabled={scanningIds[s.ref.path] || busyItems[s.ref.path]}
                                >
                                  {scanningIds[s.ref.path]
                                    ? "🔍 Scanning..."
                                    : "🔍 Scan PDF"}
                                </button>
                                <button
                                  className="admin-approve-button"
                                  disabled={busyItems[s.ref.path]}
                                  onClick={() =>
                                    performAction(s.ref.path, () => approveSyllabus(
                                      s.ref,
                                      s.collegeId,
                                      s.courseId,
                                      s.owner,
                                    ))
                                  }
                                >
                                  ✅ Approve
                                </button>
                                <button className="admin-reject-button" disabled={busyItems[s.ref.path]} onClick={() => performAction(s.ref.path, () => disapproveSyllabus(s))}>
                                  ❌ Disapprove
                                </button>
                              </div>

                              {scanResults[s.ref.path] && (
                                <div className="scan-result">
                                  {scanResults[s.ref.path].error ? (
                                    <span className="error">
                                      {scanResults[s.ref.path].error}
                                    </span>
                                  ) : (
                                    <>
                                      🛡️ <strong>Malicious:</strong>{" "}
                                      {scanResults[s.ref.path].malicious},{" "}
                                      <strong>Suspicious:</strong>{" "}
                                      {scanResults[s.ref.path].suspicious}{" "}
                                      <strong>harmless:</strong>{" "}
                                      {scanResults[s.ref.path].harmless},{" "}
                                      <strong>timeout:</strong>{" "}
                                      {scanResults[s.ref.path].timeout},{" "}
                                      <strong>undetected:</strong>{" "}
                                      {scanResults[s.ref.path].undetected}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </>
      )}
      <div className="college-request-section">
        <button
          onClick={() => setShowCollegeRequests((prev) => !prev)}
          aria-expanded={showCollegeRequests}
          className="dropdown-btn"
        >
          {showCollegeRequests ? "▼" : "►"} 📚 College Requests (
          {collegeRequests.length})
        </button>
      </div>

      {showCollegeRequests && (
        <div className="college-request-list">
          {collegeRequests.length === 0 ? (
            <p>No pending college requests.</p>
          ) : (
            collegeRequests.map((college) => (
              <div key={college.id} className="college-request-card">
                <h4>{college.name}</h4>
                <p>
                  🏙️ {college.city}, {college.state}
                </p>
                {college.message && <p>📩 "{college.message}"</p>}
                <div className="syllabus-actions">
                  <Button
                    onClick={() => {
                      approveCollege(college.id);
                    }}
                    color="green"
                  >
                    Approve
                  </Button>
                  <Button color="red" onClick={() => deleteCollege(college.id)}>
                    Disapprove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <Modal opened={!!editing} onClose={() => !saving && setEditing(null)} title="Edit upload details" centered size="lg" closeOnClickOutside={!saving} closeOnEscape={!saving} withCloseButton={!saving}>
        <form onSubmit={saveEdit} className="admin-edit-form">
          <p>Changes are saved before approval. Course names apply to all uploads in the destination course. Changing the code moves only this pending upload; its PDF stays intact.</p>
          {editError && <Alert color="red" role="alert">{editError}</Alert>}
          <fieldset disabled={saving}>
            <div className="admin-edit-grid">
              <TextInput label="Course code" required value={draft.courseCode} onChange={(e) => setDraft({ ...draft, courseCode: e.target.value })} onBlur={() => setDraft((value) => ({ ...value, courseCode: normalizeCourseCode(value.courseCode) }))} />
              <TextInput label="Course name" required value={draft.courseTitle} onChange={(e) => setDraft({ ...draft, courseTitle: e.target.value })} />
              <TextInput label="Year" required inputMode="numeric" maxLength={4} value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
              <Select label="Term" required data={COURSE_TERMS} value={draft.term} onChange={(term) => setDraft({ ...draft, term })} allowDeselect={false} disabled={saving} />
            </div>
          </fieldset>
          <div className="admin-edit-actions"><Button variant="default" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={saving}>Save changes</Button></div>
        </form>
      </Modal>
    </div>
  );
}
