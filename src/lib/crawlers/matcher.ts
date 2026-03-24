import type { CrawlResult } from './base'

export interface ArtistKeyword {
  ko: string
  en: string
  ja: string
}

/**
 * A Performance record from the database, used for deduplication checks.
 * This mirrors the shape we need for matching; adjust to your actual DB schema.
 */
export interface Performance {
  id: string
  artistName: string
  startDate: string
  endDate?: string | null
  venue?: string | null
  sourceUrl?: string | null
}

/**
 * Check whether a title matches any artist in the keyword list.
 * Returns the first matching ArtistKeyword or null.
 *
 * Matching is case-insensitive for English names and exact-substring
 * for Korean / Japanese names.
 */
export function matchArtist(
  title: string,
  keywords: ArtistKeyword[],
): ArtistKeyword | null {
  if (!title) return null

  const lowerTitle = title.toLowerCase()

  for (const kw of keywords) {
    // Korean name match
    if (kw.ko && title.includes(kw.ko)) return kw

    // English name match (case-insensitive)
    if (kw.en && lowerTitle.includes(kw.en.toLowerCase())) return kw

    // Japanese name match
    if (kw.ja && title.includes(kw.ja)) return kw
  }

  return null
}

/**
 * Detect whether a string contains Japanese hiragana or katakana characters.
 */
export function hasJapaneseCharacters(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF]/.test(text)
}

/**
 * Find an existing performance that matches the crawl result by:
 * 1. Same artist (by keyword match on title / artistName)
 * 2. Overlapping date range
 *
 * Returns the matching Performance or null.
 */
export function findMatchingPerformance(
  result: CrawlResult,
  existingPerformances: Performance[],
  keywords: ArtistKeyword[] = [],
): Performance | null {
  // Determine the artist from the crawl result title
  const crawlArtist = matchArtist(result.rawTitle, keywords)
  if (!crawlArtist) return null

  for (const perf of existingPerformances) {
    // Check if the existing performance references the same artist
    const perfArtist = matchArtist(perf.artistName, keywords)
    const isSameArtist =
      perfArtist !== null &&
      perfArtist.en.toLowerCase() === crawlArtist.en.toLowerCase()

    if (!isSameArtist) continue

    // Check for overlapping dates
    if (datesOverlap(result, perf)) {
      return perf
    }
  }

  return null
}

/**
 * Check whether the crawl result's date range overlaps with an existing
 * performance's date range.
 */
function datesOverlap(result: CrawlResult, perf: Performance): boolean {
  const crawlStart = result.dates.start
  const crawlEnd = result.dates.end ?? result.dates.start
  const perfStart = perf.startDate
  const perfEnd = perf.endDate ?? perf.startDate

  // Two ranges [a, b] and [c, d] overlap when a <= d AND c <= b
  return crawlStart <= perfEnd && perfStart <= crawlEnd
}
