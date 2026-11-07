import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router";
import { IconSearch, IconChevronRight } from "@tabler/icons-react";
import { db } from "../../../firebaseConfig";
import { publicHomeColleges } from "../../utils/homeColleges.js";
import { filterCollegeDirectory } from "../../utils/collegeDirectory.js";
import "./AllCollegesPage.css";

export default function AllCollegesPage() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    document.title = "SyllabusDB | All Colleges";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchColleges = async () => {
      setLoading(true);
      setError("");
      try {
        const snapshot = await getDocs(collection(db, "colleges"));
        const data = publicHomeColleges(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
        if (active) setColleges(data);
      } catch (fetchError) {
        console.error("Could not load college directory:", fetchError);
        if (active) setError("We couldn't load colleges. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchColleges();
    return () => { active = false; };
  }, [retry]);

  const filtered = useMemo(() => filterCollegeDirectory(colleges, { search }), [colleges, search]);
  const hasFilters = !!search.trim();

  const resetFilters = () => {
    setSearch("");
    searchRef.current?.focus();
  };

  return (
    <main className="all-colleges-page">
      <header className="acp-header">
        <h1>All colleges</h1>
      </header>

      <div className="acp-toolbar" role="search" aria-label="Find colleges">
        <div className="acp-search">
          <IconSearch size={20} aria-hidden="true" className="acp-search-icon" />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search college, city, or state"
            aria-label="Search by college name, abbreviation, city, or state"
            className="acp-search-input"
            type="search"
          />
          {search && <button className="acp-clear" aria-label="Clear search" onClick={() => { setSearch(""); searchRef.current?.focus(); }}>&times;</button>}
        </div>
      </div>

      {loading ? (
        <div className="acp-loading" role="status">
          <span className="acp-sr-only">Loading colleges...</span>
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="acp-skeleton" aria-hidden="true" />)}
        </div>
      ) : error ? (
        <div className="acp-message" role="alert">
          <h2>Colleges are unavailable</h2>
          <p>{error}</p>
          <button className="acp-primary" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </div>
      ) : (
        <>
          <div className="acp-results-summary" role="status">
            <span>{hasFilters ? `${filtered.length} of ${colleges.length}` : colleges.length} {colleges.length === 1 ? "college" : "colleges"}</span>
            {hasFilters && <button className="acp-reset" onClick={resetFilters}>Clear search</button>}
          </div>
          {filtered.length === 0 ? (
            <div className="acp-message">
              <h2>{hasFilters ? "No colleges found" : "No colleges listed yet"}</h2>
              <p>{hasFilters ? "Try a different name or location." : "Help add the first college."}</p>
              {hasFilters ? <button className="acp-primary" onClick={resetFilters}>Clear search</button> : <Link className="acp-primary" to="/requestcollege">Request a college</Link>}
            </div>
          ) : (
                  <ul className="acp-college-list" aria-label="Colleges">
                    {filtered.map((college) => (
                      <li key={college.id}>
                        <Link className="acp-college-card" to={`/college/${encodeURIComponent(college.id)}`}>
                          <span className="acp-college-info">
                            <span className="acp-college-name">{college.name}</span>
                            {[college.city, college.state].filter(Boolean).length > 0 && <span className="acp-college-city">{[college.city, college.state].filter(Boolean).join(", ")}</span>}
                          </span>
                          <span className="acp-upload-count">{college.uploads.toLocaleString()} {college.uploads === 1 ? "syllabus" : "syllabi"}</span>
                          <IconChevronRight size={18} aria-hidden="true" className="acp-chevron" />
                        </Link>
                      </li>
                    ))}
                  </ul>
          )}
          {(colleges.length > 0 || hasFilters) && <div className="acp-request">Missing your college? <Link to="/requestcollege">Request it</Link></div>}
        </>
      )}
    </main>
  );
}
