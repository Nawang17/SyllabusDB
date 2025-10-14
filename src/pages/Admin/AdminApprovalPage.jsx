import { useEffect, useState } from "react";
import { db, storage, auth, analytics } from "../../../firebaseConfig";
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
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import "./AdminApprovalPage.css";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";
import { Button } from "@mantine/core";
const allowedAdminEmail = "nawangsherpa1010@gmail.com"; //
export default function AdminApprovalPage() {
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (analytics) {
      analytics.logEvent("college_approved", {
        name: data.name,
      });
    }

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
      "Enter a reason for disapproval (this will be emailed):"
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
    const { pdf_url, id } = syllabus;

    setScanningIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(
        `https://syllabusdbserver-agza.onrender.com/scan?url=${encodeURIComponent(
          pdf_url
        )}`
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
        fetchUnapprovedSyllabi(); // ✅ now fetch after confirming admin user
        fetchUnapprovedColleges(); // fetch college requests
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
      where("approved", "==", false)
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
          doc(db, "colleges", collegeId, "courses", courseId)
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
      { merge: true }
    );
    setSyllabi((prev) => prev.filter((s) => s.ref.id !== ref.id));
    if (analytics) {
      analytics.logEvent("syllabus_approved", {
        collegeId,
      });
    }
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
      "Enter a reason for disapproval (this will be emailed):"
    );
    if (!reason) return;

    if (
      !window.confirm(
        "Are you sure you want to disapprove and delete this syllabus?"
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
          syllabus.id
        )
      );
      // after deleting the syllabus
      const syllabiRef = collection(
        db,
        "colleges",
        syllabus.collegeId,
        "courses",
        syllabus.courseId,
        "syllabi"
      );
      const remaining = await getDocs(syllabiRef);

      if (remaining.empty) {
        await deleteDoc(
          doc(db, "colleges", syllabus.collegeId, "courses", syllabus.courseId)
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
      <Button
        onClick={() => {
          auth.signOut();
          navigate("/login");
        }}
      >
        Logout
      </Button>
      <h2>Pending Syllabi for Approval</h2>
      {loading ? (
        <p>Loading...</p>
      ) : syllabi.length === 0 ? (
        <p>No pending syllabi.</p>
      ) : (
        <>
          <div className="syllabus-list">
            <h3>Total Pending: {syllabi.length}</h3>

            {Object.entries(groupedByCollege).map(([college, owners]) => (
              <div key={college} className="college-group">
                <button
                  onClick={() => toggleCollege(college)}
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
                          className="dropdown-btn inner"
                        >
                          {openOwners[key] ? "▼" : "►"} 👤 {owner.slice(0, 23)}
                          ... ({items.length})
                        </button>

                        {openOwners[key] &&
                          items.map((s) => (
                            <div className="syllabus-card" key={s.id}>
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
                                📚 <strong>{s.courseId}</strong>:{" "}
                                {s.courseTitle}
                                <br />
                                {s.experience_text && (
                                  <>
                                    <strong>Experience:</strong>{" "}
                                    {s.experience_text}
                                  </>
                                )}
                              </div>
                              <div className="syllabus-actions">
                                <a
                                  href={s.pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View PDF
                                </a>
                                <button
                                  onClick={() => scanPDF(s)}
                                  disabled={scanningIds[s.id]}
                                >
                                  {scanningIds[s.id]
                                    ? "🔍 Scanning..."
                                    : "🔍 Scan PDF"}
                                </button>
                                <button
                                  onClick={() =>
                                    approveSyllabus(
                                      s.ref,
                                      s.collegeId,
                                      s.courseId,
                                      s.owner
                                    )
                                  }
                                >
                                  ✅ Approve
                                </button>
                                <button onClick={() => disapproveSyllabus(s)}>
                                  ❌ Disapprove
                                </button>
                              </div>

                              {scanResults[s.id] && (
                                <div className="scan-result">
                                  {scanResults[s.id].error ? (
                                    <span className="error">
                                      {scanResults[s.id].error}
                                    </span>
                                  ) : (
                                    <>
                                      🛡️ <strong>Malicious:</strong>{" "}
                                      {scanResults[s.id].malicious},{" "}
                                      <strong>Suspicious:</strong>{" "}
                                      {scanResults[s.id].suspicious}{" "}
                                      <strong>harmless:</strong>{" "}
                                      {scanResults[s.id].harmless},{" "}
                                      <strong>timeout:</strong>{" "}
                                      {scanResults[s.id].timeout},{" "}
                                      <strong>undetected:</strong>{" "}
                                      {scanResults[s.id].undetected}
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
    </div>
  );
}
