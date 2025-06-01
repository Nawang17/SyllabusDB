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
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import "./AdminApprovalPage.css";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";
const allowedAdminEmail = "nawangsherpa1010@gmail.com"; //
export default function AdminApprovalPage() {
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      console.log("Current user:", currUser);
      if (!currUser || currUser.email !== allowedAdminEmail) {
        navigate("/login"); // or back to home
      } else {
        if (!currUser) {
          navigate("/login");
        }
      }
    });
    fetchUnapprovedSyllabi();

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchUnapprovedSyllabi();
  }, []);

  const fetchUnapprovedSyllabi = async () => {
    setLoading(true);
    const snapshot = await getDocs(collectionGroup(db, "syllabi"));
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

  const approveSyllabus = async (ref) => {
    await updateDoc(ref, { approved: true });
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
        // 4. If no syllabi remain, delete the course document too
        const courseDocRef = doc(
          db,
          "colleges",
          syllabus.collegeId,
          "courses",
          syllabus.courseId
        );
        await deleteDoc(courseDocRef);
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
                <button onClick={() => approveSyllabus(s.ref)}>
                  ✅ Approve
                </button>
                <button onClick={() => disapproveSyllabus(s)}>
                  ❌ Disapprove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
