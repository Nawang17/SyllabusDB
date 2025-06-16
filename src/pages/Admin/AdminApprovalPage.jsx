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

  const toggleOwner = (college, owner) => {
    const key = `${college}__${owner}`;
    setOpenOwners((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigate = useNavigate();
  const scanPDF = async (syllabus) => {
    const { pdf_url, id } = syllabus;

    setScanningIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(
        `https://syllabusdbserver.onrender.com/scan?url=${encodeURIComponent(
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
      }
    });

    return () => unsubscribe();
  }, [navigate]);
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
        });
      }
    }

    console.log("Unapproved syllabi:", unapproved);
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

  const approveSyllabus = async (ref, collegeId, courseId) => {
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
    setSyllabi((prev) => prev.filter((s) => s.ref.id !== ref.id));
  };

  const disapproveSyllabus = async (syllabus) => {
    try {
      // 1. Delete the PDF file from Firebase Storage
      const fileRef = storageRef(storage, syllabus.file_path);
      await deleteObject(fileRef);

      // 2. Delete the syllabus document from Firestore
      const syllabusDocRef = doc(
        db,
        "colleges",
        syllabus.collegeId,
        "courses",
        syllabus.courseId,
        "syllabi",
        syllabus.id
      );
      await deleteDoc(syllabusDocRef);

      // 3. Check if any syllabi remain for this course
      const syllabiSnapshot = await getDocs(
        collection(
          db,
          "colleges",
          syllabus.collegeId,
          "courses",
          syllabus.courseId,
          "syllabi"
        )
      );

      if (syllabiSnapshot.empty) {
        // No syllabi left → delete the course
        const courseDocRef = doc(
          db,
          "colleges",
          syllabus.collegeId,
          "courses",
          syllabus.courseId
        );
        await deleteDoc(courseDocRef);
      } else {
        // Update course approved status + count
        const approvedCount = syllabiSnapshot.docs.filter(
          (d) => d.data().approved
        ).length;

        const courseDocRef = doc(
          db,
          "colleges",
          syllabus.collegeId,
          "courses",
          syllabus.courseId
        );
        await updateDoc(courseDocRef, {
          approved: approvedCount > 0,
          approvedSyllabiCount: approvedCount,
        });
      }

      alert("Syllabus disapproved and deleted.");
      fetchUnapprovedSyllabi(); // refresh
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
        {" "}
        Logout{" "}
      </Button>
      <h2>Pending Syllabi for Approval</h2>
      {loading ? (
        <p>Loading...</p>
      ) : syllabi.length === 0 ? (
        <p>No pending syllabi.</p>
      ) : (
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
                        {openOwners[key] ? "▼" : "►"} 👤 ...{owner.slice(-5)} (
                        {items.length})
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
                              – Prof. {s.professor}
                              <br />
                              📚 <strong>{s.courseId}</strong>: {s.courseTitle}
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
                                    s.courseId
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
      )}
    </div>
  );
}
