/**
 * Parse Korean date strings into ISO date format (YYYY-MM-DD).
 *
 * Supported formats:
 * - "2026.04.15"
 * - "2026년 4월 15일"
 * - "2026-04-15"
 * - "2026.04.15(화)" (with day-of-week in parentheses)
 */
export function parseKoreanDate(dateStr: string): string | null {
  if (!dateStr) return null

  const trimmed = dateStr.trim()

  const dotMatch = trimmed.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
  if (dotMatch) {
    const [, year, month, day] = dotMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const koreanMatch = trimmed.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
  if (koreanMatch) {
    const [, year, month, day] = koreanMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const isoMatch = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}
