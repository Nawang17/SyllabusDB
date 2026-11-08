import { useEffect, useRef, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useHydrated } from '@tanstack/react-router'
import { Link } from '../lib/navigation'
import { coursePath } from '../lib/seo'
import { extractSubject, normalizeCourseCode } from '../utils/courseCode'
import { browseCollegeCourses, courseInitial, syllabusCount } from '../utils/collegeCourses'
import { Button } from './ui/button'

export default function CollegeCourseBrowser({ collegeId, courses }) {
  const hydrated = useHydrated()
  const [search, setSearch] = useState('')
  const [letter, setLetter] = useState('')
  const [limit, setLimit] = useState(50)
  const filterRef = useRef(null)
  const [scrollEdges, setScrollEdges] = useState({ left:false, right:false })
  useEffect(() => {
    const strip = filterRef.current
    const update = () => setScrollEdges({ left:strip.scrollLeft > 1, right:strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1 })
    const observer = new ResizeObserver(update)
    observer.observe(strip)
    strip.addEventListener('scroll', update)
    update()
    return () => { observer.disconnect(); strip.removeEventListener('scroll', update) }
  }, [courses])
  const scrollFilters = direction => {
    const strip = filterRef.current
    strip.scrollBy({ left:direction * strip.clientWidth * .75, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  const availableLetters = new Set(courses.map(courseInitial))
  const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'].filter(initial => availableLetters.has(initial))
  const shown = browseCollegeCourses(courses, { search, letter, sort:letter ? 'code' : 'popular' })
  const clearFilters = () => { setSearch(''); setLetter(''); setLimit(50) }

  return <>
    <div className="cp-browse-header">
      <h2>Browse courses</h2>
      <input type="search" className="cp-search" aria-label="Search course code or name" placeholder="Search course code or name" disabled={!hydrated} value={search} onChange={event => { setSearch(event.target.value); setLimit(50) }} />
    </div>
    <div className="cp-course-controls">
      {scrollEdges.left && <button type="button" className="cp-filter-arrow" aria-label="Scroll course filters left" onClick={() => scrollFilters(-1)}><IconChevronLeft size={18} aria-hidden="true" /></button>}
      <div ref={filterRef} className="cp-letter-filter" role="group" aria-label="Course filters">
        <button type="button" aria-pressed={!letter} disabled={!hydrated} onClick={() => { setLetter(''); setLimit(50) }}>Popular</button>
        {letters.map(initial => <button type="button" key={initial} aria-label={initial === '#' ? 'Other course codes' : `Courses starting with ${initial}`} aria-pressed={letter === initial} disabled={!hydrated} onClick={() => { setLetter(initial); setLimit(50) }}>{initial}</button>)}
      </div>
      {scrollEdges.right && <button type="button" className="cp-filter-arrow" aria-label="Scroll course filters right" onClick={() => scrollFilters(1)}><IconChevronRight size={18} aria-hidden="true" /></button>}
    </div>
    <p className="cp-result-count" role="status">{shown.length} {shown.length === 1 ? 'course' : 'courses'}{search || letter ? ` of ${courses.length}` : ''}{letter ? ` starting with ${letter === '#' ? 'a number or symbol' : letter}` : ''}</p>
    {shown.length ? <ul className="cp-course-grid" aria-label="College courses">
      {shown.slice(0, limit).map(item => {
        const code = normalizeCourseCode(item.code || item.id)
        const count = syllabusCount(item)
        return <li key={item.id}>
          <Link className="cp-subject cp-course-card" to={coursePath(collegeId, extractSubject(item.code || item.id), item.id)}>
            <div><h3>{code}</h3>{(item.title || item.name) && <p className="cp-course-name">{item.title || item.name}</p>}<p>{count.toLocaleString()} {count === 1 ? 'syllabus' : 'syllabi'}</p></div>
            <span aria-hidden="true">›</span>
          </Link>
        </li>
      })}
    </ul> : <div className="cp-empty"><p>{courses.length ? 'No courses match these filters.' : 'No published courses yet. Share the first syllabus.'}</p>{courses.length > 0 && <Button variant="outline" onClick={clearFilters}>Clear filters</Button>}</div>}
    {shown.length > limit && <Button className="mt-4" variant="outline" onClick={() => setLimit(value => value + 50)}>Show more courses</Button>}
  </>
}
