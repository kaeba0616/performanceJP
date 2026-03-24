import * as cheerio from 'cheerio'
import {
  type CrawlResult,
  type Crawler,
  fetchWithDelay,
  parseKoreanDate,
} from './base'

const BASE_URL = 'https://ticket.melon.com'

/**
 * Melon Ticket Crawler
 *
 * Crawls the concert section on ticket.melon.com.
 *
 * IMPORTANT: CSS selectors below are based on typical Korean ticket-site
 * patterns and may need adjustment after inspecting the actual site HTML.
 * Check and update selectors marked with "TODO: verify selector" comments.
 */
export class MelonCrawler implements Crawler {
  source = 'melon' as const

  /**
   * Fetch the concert listing page and extract basic info for each show.
   */
  async crawlList(): Promise<CrawlResult[]> {
    // TODO: verify URL path - Melon ticket concert category
    const listUrl = `${BASE_URL}/concert/index.htm?genreType=CONCERT&subGenre=FOREIGN`

    let html: string
    try {
      html = await fetchWithDelay(listUrl, 0)
    } catch (error) {
      console.error(`[Melon] Failed to fetch list page: ${error}`)
      return []
    }

    const $ = cheerio.load(html)
    const results: CrawlResult[] = []
    const detailUrls: string[] = []

    // TODO: verify selector - list items on the concert category page
    $(
      '.list_ticket li, .perf-list .item, .concert-list .concert-item',
    ).each((_, el) => {
      // TODO: verify selector - link to detail page
      const linkEl = $(el)
        .find('a[href*="prodId="], a[href*="detail"], a[href*="product"]')
        .first()
      const href = linkEl.attr('href')

      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`
        detailUrls.push(fullUrl)
      }
    })

    console.log(`[Melon] Found ${detailUrls.length} listings`)

    for (const url of detailUrls) {
      try {
        const detail = await this.crawlDetail(url)
        if (detail) results.push(detail)
      } catch (error) {
        console.error(`[Melon] Failed to crawl detail ${url}: ${error}`)
      }
    }

    return results
  }

  /**
   * Fetch a single performance detail page and extract structured data.
   */
  async crawlDetail(url: string): Promise<CrawlResult | null> {
    let html: string
    try {
      html = await fetchWithDelay(url)
    } catch (error) {
      console.error(`[Melon] Failed to fetch detail page ${url}: ${error}`)
      return null
    }

    const $ = cheerio.load(html)

    const sourceId = extractSourceId(url)
    if (!sourceId) {
      console.warn(`[Melon] Could not extract source ID from ${url}`)
      return null
    }

    // TODO: verify selector - performance title
    const rawTitle = (
      $('.tit_detail').text() ||
      $('h2.perf-title').text() ||
      $('meta[property="og:title"]').attr('content') ||
      ''
    ).trim()

    if (!rawTitle) return null

    // TODO: verify selector - date information
    const dateText = (
      $('.info_detail .date').text() ||
      $('dl.info_list dd.date').text() ||
      $('.perf-info .period').text() ||
      ''
    ).trim()

    const dates = parseDateRange(dateText)
    if (!dates) return null

    // TODO: verify selector - venue
    const venue = (
      $('.info_detail .venue').text() ||
      $('dl.info_list dd.place').text() ||
      $('.perf-info .location').text() ||
      ''
    ).trim()

    // TODO: verify selector - ticket open date
    const ticketOpenText = (
      $('.info_detail .ticket-open').text() ||
      $('dl.info_list dd.ticketOpen').text() ||
      ''
    ).trim()
    const ticketOpenAt = parseKoreanDate(ticketOpenText)

    // TODO: verify selector - presale date
    const presaleText = (
      $('.info_detail .presale').text() ||
      $('dl.info_list dd.presale').text() ||
      ''
    ).trim()
    const presaleOpenAt = parseKoreanDate(presaleText)

    // TODO: verify selector - price info
    const priceInfo = (
      $('.info_detail .price').text() ||
      $('dl.info_list dd.price').text() ||
      ''
    ).trim()

    // TODO: verify selector - poster/image
    const imageUrl =
      $('.wrap_poster img').attr('src') ||
      $('.perf-img img').attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      undefined

    return {
      source: 'melon',
      sourceUrl: url,
      sourceId,
      rawTitle,
      dates,
      venue: venue || undefined,
      ticketOpenAt: ticketOpenAt || undefined,
      presaleOpenAt: presaleOpenAt || undefined,
      priceInfo: priceInfo || undefined,
      imageUrl: imageUrl ? normalizeImageUrl(imageUrl) : undefined,
      rawData: {
        dateText,
        ticketOpenText,
        presaleText,
      },
    }
  }
}

/**
 * Extract the performance/product ID from a Melon URL.
 */
function extractSourceId(url: string): string | null {
  // e.g. prodId=12345 or /product/12345 or /detail/12345
  const prodMatch = url.match(/prodId=(\d+)/i)
  if (prodMatch) return prodMatch[1]

  const pathMatch = url.match(/\/(?:product|detail)\/(\d+)/i)
  if (pathMatch) return pathMatch[1]

  return null
}

/**
 * Parse a date-range string like "2026.04.15 ~ 2026.04.17" into start/end.
 */
function parseDateRange(
  text: string,
): { start: string; end?: string } | null {
  if (!text) return null

  const rangeMatch = text.match(
    /(\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}[일]?)\s*[~\-]\s*(\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}[일]?)/,
  )
  if (rangeMatch) {
    const start = parseKoreanDate(rangeMatch[1])
    const end = parseKoreanDate(rangeMatch[2])
    if (start) return { start, end: end || undefined }
  }

  const single = parseKoreanDate(text)
  if (single) return { start: single }

  return null
}

/**
 * Ensure image URLs are absolute.
 */
function normalizeImageUrl(url: string): string {
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${BASE_URL}${url}`
  return url
}
