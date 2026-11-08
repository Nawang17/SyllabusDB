import test from 'node:test'
import assert from 'node:assert/strict'
import { browseCollegeCourses, courseInitial } from './collegeCourses.js'

const courses = [
  { id: 'cs', code: 'CS-GY 9215', title: 'Distributed Systems', approvedSyllabiCount: 2 },
  { id: 'art10', code: 'ART 10', title: 'Drawing', approvedSyllabiCount: 8 },
  { id: 'art2', code: 'art2', title: 'Painting', approvedSyllabiCount: 8 },
  { id: '2D 101', title: 'Design' },
  { id: 'acct', code: 'ACCT 101', title: 'Accounting', approvedSyllabiCount: 3 },
]

test('popular ranks by published syllabus count with stable natural code ties', () => {
  assert.deepEqual(browseCollegeCourses(courses).map(course => course.id), ['art2','art10','acct','cs','2D 101'])
  assert.equal(courses[0].id, 'cs')
})

test('letter, course-name search and compact-code search work together', () => {
  assert.deepEqual(browseCollegeCourses(courses, { letter:'A', sort:'code' }).map(course => course.id), ['acct','art2','art10'])
  assert.deepEqual(browseCollegeCourses(courses, { letter:'A', search:'painting' }).map(course => course.id), ['art2'])
  assert.deepEqual(browseCollegeCourses(courses, { search:'cs-gy9215' }).map(course => course.id), ['cs'])
  assert.deepEqual(browseCollegeCourses(courses, { letter:'B' }), [])
  assert.equal(courseInitial({ id:'2D 101' }), '#')
  assert.equal(courseInitial({ id:'cs-gy9215' }), 'C')
})
