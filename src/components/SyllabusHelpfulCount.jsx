import { useEffect, useRef, useState } from 'react'
import { IconThumbUp } from '@tabler/icons-react'
import { getHelpfulCount } from '../lib/public-loader'
import { helpfulSummary } from '../utils/helpfulSummary'

export default function SyllabusHelpfulCount({ collegeId, courseId, syllabusId }) {
  const holder = useRef(null)
  const [count, setCount] = useState(null)
  useEffect(() => {
    let active = true
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      getHelpfulCount({ data:{ collegeId, courseId, syllabusId } })
        .then(value => { if (active) setCount(value) })
        .catch(() => { if (active) setCount(null) })
    }, { rootMargin:'100px' })
    observer.observe(holder.current.closest('article'))
    return () => { active = false; observer.disconnect() }
  }, [collegeId, courseId, syllabusId])
  const summary = helpfulSummary(count)
  return <span ref={holder} hidden={!summary} className={summary ? 'course-syllabus-helpful' : undefined}>
    {summary && <><IconThumbUp size={15} aria-hidden="true" />{summary}</>}
  </span>
}
