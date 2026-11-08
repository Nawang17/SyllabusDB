import { useId } from 'react'
import { IconChevronRight, IconFileDescription } from '@tabler/icons-react'
import { Link } from '../lib/navigation'
import SyllabusHelpfulCount from './SyllabusHelpfulCount'
import './CourseSyllabusCard.css'

export default function CourseSyllabusCard({ syllabus, to, collegeId, courseId }) {
  const headingId = useId()
  const term = [syllabus.term, syllabus.year].filter(Boolean).join(' ')
  const label = [term, syllabus.professor].filter(Boolean).join(' · ') || 'View syllabus'
  return <article className="course-syllabus-card">
    <Link className="course-syllabus-link" to={to} aria-labelledby={headingId}>
      <span className="course-syllabus-icon" aria-hidden="true"><IconFileDescription size={25} stroke={1.6} /></span>
      <div className="course-syllabus-info">
        <h3 id={headingId}>{label}</h3>
        <SyllabusHelpfulCount collegeId={collegeId} courseId={courseId} syllabusId={syllabus.id} />
      </div>
      <IconChevronRight className="course-syllabus-arrow" size={19} aria-hidden="true" />
    </Link>
  </article>
}
