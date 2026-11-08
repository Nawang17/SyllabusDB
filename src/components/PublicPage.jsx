import { useEffect, useRef, useState } from 'react'
import { useHydrated } from '@tanstack/react-router'
import { Link, useLocation } from '../lib/navigation'
import { normalizeCourseCode, courseCodeMatches } from '../utils/courseCode'
import { collegePath, subjectPath, coursePath, syllabusPath } from '../lib/seo'
import SyllabusViewerPage from '../pages/Subjects/SyllabusViewerPage'
import '../pages/CollegePage/CollegePage.css'
import '../pages/Subjects/SubjectPage.css'
import illustration from '../assets/college_illustration.jpg'
import { Button } from './ui/button'
import CollegeCourseBrowser from './CollegeCourseBrowser'
import CourseSyllabusCard from './CourseSyllabusCard'
export default function PublicPage({ data, params }) {
  const location = useLocation()
  const hydrated = useHydrated()
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get('course') || '')
  const previousSearch = useRef(location.search)
  useEffect(() => { if (previousSearch.current !== location.search) { previousSearch.current = location.search; setSearch(new URLSearchParams(location.search).get('course') || '') } }, [location.search])
  const [limit, setLimit] = useState(50)
  const { college, subjects, courses = [], course, syllabi = [], syllabus } = data
  if (syllabus) return <SyllabusViewerPage key={syllabus.id} initialData={data} />
  const id = college.id
  const subject = params.subject?.toUpperCase()
  const base = collegePath(id)
  const title = course ? `${normalizeCourseCode(course.code || course.id)}${course.title || course.name ? ` · ${course.title || course.name}` : ''}` : subject ? `${subject} syllabi` : college.name || id
  const shownCourses = courses.filter(item => courseCodeMatches(item.code || item.id, search) || (item.title || item.name || '').toLowerCase().includes(search.toLowerCase()))
  const shownSyllabi = [...syllabi].sort((a,b) => Number(b.year || 0)-Number(a.year || 0)).filter(item => [item.professor,item.term,item.year].join(' ').toLowerCase().includes(search.toLowerCase()))
  return <main className={subject ? 'college-page subject-page' : 'college-page'}>
    {(subject || course) && <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={base}>{college.name || id}</Link>{subject && !course && <><span>/</span><Link to={subjectPath(id,subject)}>{subject}</Link></>}</nav>}
    <header className={subject ? 'cp-header cp-plain-header' : 'cp-header'}>{!subject && <img src={college.image_url || illustration} className="cp-cover" alt="" />}<div className="cp-heading"><h1>{title}</h1>{!subject && <p className="cp-location">{[college.city,college.state].filter(Boolean).join(', ')}</p>}<p className="cp-summary">{course ? `${syllabi.length} published syllabi` : `${courses.length} courses${!subject ? ` · ${subjects.length} subjects` : ''}`}</p></div><Link className="cp-primary" to={`/uploadSyllabus/${encodeURIComponent(id)}`}>Upload a syllabus</Link></header>
    <section className="cp-browse">{(course || subject) && <div className="cp-browse-header"><h2>{course ? 'Published syllabi' : subject ? 'Browse courses' : 'Browse subjects'}</h2><input type="search" disabled={!hydrated} className="cp-search" aria-label={course ? 'Search professor or semester' : 'Search subjects or courses'} placeholder={course ? 'Search professor or semester' : 'Search subjects or courses'} value={search} onChange={event => { setSearch(event.target.value); setLimit(50) }} /></div>}
    {course ? <div className="course-syllabus-grid">{shownSyllabi.slice(0,limit).map(item => <CourseSyllabusCard key={item.id} collegeId={id} courseId={course.id} syllabus={item} to={syllabusPath(id,subject,course.id,item.id)} />)}{!shownSyllabi.length && <p>No published syllabi match this search.</p>}</div> : subject ? <ul className="grid gap-3">{shownCourses.slice(0,limit).map(item => <li key={item.id}><Link className="cp-subject" to={coursePath(id,subject,item.id)}><div><h3>{normalizeCourseCode(item.code || item.id)}</h3>{(item.title || item.name) && <p>{item.title || item.name}</p>}<p>{item.approvedSyllabiCount || 0} syllabi</p></div><span aria-hidden="true">›</span></Link></li>)}</ul> : <CollegeCourseBrowser key={id} collegeId={id} courses={courses} />}
    {(course || subject) && (course ? shownSyllabi : shownCourses).length > limit && <Button className="mt-4" variant="outline" onClick={() => setLimit(value => value + 50)}>Show more</Button>}
    {!course && subject && !shownCourses.length && <p className="cp-empty">{search ? 'No matching results. Try another search.' : 'No published courses yet. Share the first syllabus.'}</p>}
    </section>
  </main>
}
