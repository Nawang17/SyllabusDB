import test from 'node:test'
import assert from 'node:assert/strict'
import { helpfulSummary } from './helpfulSummary.js'

test('helpful summaries appear for positive integer counts with correct pluralization', () => {
  for (const count of [undefined, null, 0, -1, NaN, Infinity, 1.5, '2']) {
    assert.equal(helpfulSummary(count), null)
  }
  assert.equal(helpfulSummary(1), '1 person found this helpful')
  assert.equal(helpfulSummary(2), '2 people found this helpful')
  assert.equal(helpfulSummary(1200), '1,200 people found this helpful')
})
