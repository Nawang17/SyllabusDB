export function helpfulSummary(count) {
  return Number.isSafeInteger(count) && count > 0
    ? `${count.toLocaleString('en-US')} ${count === 1 ? 'person' : 'people'} found this helpful`
    : null
}
