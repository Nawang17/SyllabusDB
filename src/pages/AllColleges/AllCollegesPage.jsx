import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router";
import { IconSearch, IconChevronRight } from "@tabler/icons-react";
import { db } from "../../../firebaseConfig";
import { publicHomeColleges } from "../../utils/homeColleges.js";
import { filterCollegeDirectory, groupCollegeDirectory } from "../../utils/collegeDirectory.js";
import "./AllCollegesPage.css";

export default function AllCollegesPage() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [sort, setSort] = useState("name");
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

  const states = useMemo(() => groupCollegeDirectory(colleges).map(([name]) => name), [colleges]);
  const filtered = useMemo(() => filterCollegeDirectory(colleges, { search, state, sort }), [colleges, search, state, sort]);
  const groups = useMemo(() => groupCollegeDirectory(filtered), [filtered]);
  const hasFilters = !!search.trim() || !!state;

  const resetFilters = () => {
    setSearch("");
    setState("");
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
        <select className="acp-select" aria-label="Filter by state" value={state} onChange={(event) => setState(event.target.value)} disabled={loading || !!error}>
          <option value="">All states</option>
          {states.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select className="acp-select" aria-label="Sort colleges within each state" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="name">Name: A to Z</option>
          <option value="uploads">Most syllabi in each state</option>
        </select>
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
            {hasFilters && <button className="acp-reset" onClick={resetFilters}>Clear filters</button>}
          </div>
          {groups.length === 0 ? (
            <div className="acp-message">
              <h2>{hasFilters ? "No colleges found" : "No colleges listed yet"}</h2>
              <p>{hasFilters ? "Try a different name or location." : "Help add the first college."}</p>
              {hasFilters ? <button className="acp-primary" onClick={resetFilters}>Clear filters</button> : <Link className="acp-primary" to="/requestcollege">Request a college</Link>}
            </div>
          ) : (
            <div className="acp-groups">
              {groups.map(([name, items]) => (
                <section key={name} className="acp-state-section" aria-label={`${name} colleges`}>
                  <h2 className="acp-state-title">{name}<span className="acp-state-count">{items.length}</span></h2>
                  <ul className="acp-college-list">
                    {items.map((college) => (
                      <li key={college.id}>
                        <Link className="acp-college-card" to={`/college/${encodeURIComponent(college.id)}`}>
                          <span className="acp-monogram" aria-hidden="true">{college.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("")}</span>
                          <span className="acp-college-info">
                            <span className="acp-college-name">{college.name}</span>
                            {college.city && <span className="acp-college-city">{college.city}</span>}
                            <span className="acp-upload-count">{college.uploads.toLocaleString()} {college.uploads === 1 ? "syllabus" : "syllabi"}</span>
                          </span>
                          <IconChevronRight size={18} aria-hidden="true" className="acp-chevron" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {(colleges.length > 0 || hasFilters) && <div className="acp-request">Missing your college? <Link to="/requestcollege">Request it</Link></div>}
        </>
      )}
    </main>
  );
}
