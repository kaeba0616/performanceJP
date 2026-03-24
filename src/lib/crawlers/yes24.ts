import * as cheerio from 'cheerio'
import {
  type CrawlResult,
  type Crawler,
  fetchWithDelay,
  parseKoreanDate,
} from './base'

const BASE_URL = 'https://ticket.yes24.com'

/**
 * Yes24 Ticket Crawler
 *
 * Crawls the concert / 내한공연 category on ticket.yes24.com.
 *
 * IMPORTANT: CSS selectors below are based on typical Korean ticket-site
 * patterns and may need adjustment after inspecting the actual site HTML.
 * Check and update selectors marked with "TODO: verify selector" comments.
 */
export class Yes24Crawler implements Crawler {
  source = 'yes24' as const

  /**
   * Fetch the category listing page and extract basic info for each show.
   */
  async crawlList(): Promise<CrawlResult[]> {
    // TODO: verify URL path - this is the typical concert/내한공연 category page
    const listUrl = `${BASE_URL}/New/Genre/GenreList.aspx?genretype=1&genre=15456`

    let html: string
    try {
      html = await fetchWithDelay(listUrl, 0) // no delay for first request
    } catch (error) {
      console.error(`[Yes24] Failed to fetch list page: ${error}`)
      return []
    }

    const $ = cheerio.load(html)
    const results: CrawlResult[] = []
    const detailUrls: string[] = []

    // TODO: verify selector - list items on the category page
    $('.list-product li, .tbl-row .item, .perf-product').each((_, el) => {
      // TODO: verify selector - link to detail page
      const linkEl = $(el).find('a[href*="PerfNo="], a[href*="Goods"]').first()
      const href = linkEl.attr('href')

      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`
        detailUrls.push(fullUrl)
      }
    })

    console.log(`[Yes24] Found ${detailUrls.length} listings`)

    // Crawl each detail page
    for (const url of detailUrls) {
      try {
        const detail = await this.crawlDetail(url)
        if (detail) results.push(detail)
      } catch (error) {
        console.error(`[Yes24] Failed to crawl detail ${url}: ${error}`)
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
      console.error(`[Yes24] Failed to fetch detail page ${url}: ${error}`)
      return null
    }

    const $ = cheerio.load(html)

    // Extract source ID from URL
    const sourceId = extractSourceId(url)
    if (!sourceId) {
      console.warn(`[Yes24] Could not extract source ID from ${url}`)
      return null
    }

    // TODO: verify selector - performance title
    const rawTitle = (
      $('.rn-big-title').text() ||
      $('h2.prd-title').text() ||
      $('meta[property="og:title"]').attr('content') ||
      ''
    ).trim()

    if (!rawTitle) return null

    // TODO: verify selector - date information
    const dateText = (
      $('.rn-product-area1 .rn-03').text() ||
      $('.prd-info .date').text() ||
      ''
    ).trim()

    const dates = parseDateRange(dateText)
    if (!dates) return null

    // TODO: verify selector - venue
    const venue = (
      $('.rn-product-area1 .rn-05').text() ||
      $('.prd-info .venue').text() ||
      ''
    ).trim()

    // TODO: verify selector - ticket open date
    const ticketOpenText = (
      $('.rn-product-area2 .rn-07').text() ||
      $('.prd-info .ticket-open').text() ||
      ''
    ).trim()
    const ticketOpenAt = parseKoreanDate(ticketOpenText)

    // TODO: verify selector - presale date
    const presaleText = (
      $('.rn-product-area2 .rn-presale').text() ||
      ''
    ).trim()
    const presaleOpenAt = parseKoreanDate(presaleText)

    // TODO: verify selector - price info
    const priceInfo = (
      $('.rn-product-area2 .rn-06').text() ||
      $('.prd-info .price').text() ||
      ''
    ).trim()

    // TODO: verify selector - poster/image
    const imageUrl =
      $('.rn-product-imgbox img').attr('src') ||
      $('.prd-img img').attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      undefined

    return {
      source: 'yes24',
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
 * Extract the performance/goods ID from a Yes24 URL.
 */
function extractSourceId(url: string): string | null {
  // e.g. PerfNo=12345 or /Goods/12345
  const perfNoMatch = url.match(/PerfNo=(\d+)/i)
  if (perfNoMatch) return perfNoMatch[1]

  const goodsMatch = url.match(/\/Goods\/(\d+)/i)
  if (goodsMatch) return goodsMatch[1]

  return null
}

/**
 * Parse a date-range string like "2026.04.15 ~ 2026.04.17" into start/end.
 */
function parseDateRange(
  text: string,
): { start: string; end?: string } | null {
  if (!text) return null

  // Try range format: "2026.04.15 ~ 2026.04.17"
  const rangeMatch = text.match(
    /(\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}[일]?)\s*[~\-]\s*(\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}[일]?)/,
  )
  if (rangeMatch) {
    const start = parseKoreanDate(rangeMatch[1])
    const end = parseKoreanDate(rangeMatch[2])
    if (start) return { start, end: end || undefined }
  }

  // Try single date
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
