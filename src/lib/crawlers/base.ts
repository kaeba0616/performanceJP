export interface CrawlResult {
  source: 'yes24' | 'interpark' | 'melon'
  sourceUrl: string
  sourceId: string
  rawTitle: string
  dates: { start: string; end?: string }
  venue?: string
  ticketOpenAt?: string
  presaleOpenAt?: string
  priceInfo?: string
  imageUrl?: string
  rawData: Record<string, unknown>
}

export interface Crawler {
  source: string
  crawlList(): Promise<CrawlResult[]>
  crawlDetail(url: string): Promise<CrawlResult | null>
}

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/**
 * Fetch a URL with a polite delay and a realistic User-Agent header.
 * @param url - The URL to fetch.
 * @param delayMs - Milliseconds to wait before the request (default 1500).
 */
export async function fetchWithDelay(
  url: string,
  delayMs = 1500,
): Promise<string> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    )
  }

  return response.text()
}

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

  // "2026.04.15" or "2026.04.15(화)"
  const dotMatch = trimmed.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
  if (dotMatch) {
    const [, year, month, day] = dotMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // "2026년 4월 15일"
  const koreanMatch = trimmed.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
  if (koreanMatch) {
    const [, year, month, day] = koreanMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // "2026-04-15"
  const isoMatch = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}
