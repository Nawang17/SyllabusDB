import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useNavigate } from "react-router";
import "./AllCollegesPage.css";

export default function AllCollegesPage() {
  const [collegesByState, setCollegesByState] = useState({});
  const [totalColleges, setTotalColleges] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
      const snapshot = await getDocs(collection(db, "colleges"));
      const grouped = {};
      let approvedCount = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.approved === false) return; // Skip unapproved

        const state = data.state || "Unknown";
        if (!grouped[state]) grouped[state] = [];

        grouped[state].push({
          id: doc.id,
          name: data.name,
        });

        approvedCount += 1;
      });

      // Sort states alphabetically
      const sortedStates = Object.keys(grouped).sort();
      const sortedGrouped = {};
      sortedStates.forEach((state) => {
        sortedGrouped[state] = grouped[state].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

      setCollegesByState(sortedGrouped);
      setTotalColleges(approvedCount);
    };

    fetchColleges();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="all-colleges-page">
      <h1 className="page-title">{totalColleges} Colleges on SyllabusDB</h1>

      {Object.keys(collegesByState).map((state) => (
        <div key={state} className="state-group">
          <h2 className="state-title">{state}</h2>
          <ul className="college-list">
            {collegesByState[state].map((college) => (
              <li
                key={college.id}
                className="college-link"
                onClick={() => navigate(`/college/${college.id}`)}
              >
                {college.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="request-college-cta">
        <p>Don’t see your college listed?</p>
        <button onClick={() => navigate("/requestcollege")}>
          Request a College
        </button>
      </div>
    </div>
  );
}
