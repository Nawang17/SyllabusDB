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
        const { term, year, professor, pdf_url, file_path } = data;

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
        });
      }
    }

    setSyllabi(unapproved);
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
          {syllabi.map((s) => (
            <div className="syllabus-card" key={s.id}>
              <div className="syllabus-info">
                <strong>
                  {s.term} {s.year}
                </strong>{" "}
                – Prof. {s.professor}
                <br />
                📚 <strong>{s.courseId}</strong>: {s.courseTitle}
                <br />
                🏫 <em>{s.collegeName}</em>
              </div>
              <div className="syllabus-actions">
                <a href={s.pdf_url} target="_blank" rel="noreferrer">
                  View PDF
                </a>
                <button onClick={() => scanPDF(s)} disabled={scanningIds[s.id]}>
                  {scanningIds[s.id] ? "🔍 Scanning..." : "🔍 Scan PDF"}
                </button>
                <button
                  onClick={() =>
                    approveSyllabus(s.ref, s.collegeId, s.courseId)
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
                    <span className="error">{scanResults[s.id].error}</span>
                  ) : (
                    <>
                      🛡️ <strong>Malicious:</strong>{" "}
                      {scanResults[s.id].malicious},{" "}
                      <strong>Suspicious:</strong>{" "}
                      {scanResults[s.id].suspicious} <strong>harmless:</strong>{" "}
                      {scanResults[s.id].harmless}, <strong>timeout:</strong>{" "}
                      {scanResults[s.id].timeout}, <strong>undetected:</strong>{" "}
                      {scanResults[s.id].undetected}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
