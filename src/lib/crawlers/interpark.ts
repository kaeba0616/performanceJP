import * as cheerio from 'cheerio'
import {
  type CrawlResult,
  type Crawler,
  fetchWithDelay,
  parseKoreanDate,
} from './base'

const BASE_URL = 'https://tickets.interpark.com'

/**
 * Interpark Ticket Crawler
 *
 * Crawls the concert / 내한공연 category on tickets.interpark.com.
 *
 * IMPORTANT: CSS selectors below are based on typical Korean ticket-site
 * patterns and may need adjustment after inspecting the actual site HTML.
 * Check and update selectors marked with "TODO: verify selector" comments.
 */
export class InterparkCrawler implements Crawler {
  source = 'interpark' as const

  /**
   * Fetch the category listing page and extract basic info for each show.
   */
  async crawlList(): Promise<CrawlResult[]> {
    // TODO: verify URL path - Interpark concert/내한공연 category
    const listUrl = `${BASE_URL}/contents/genre/concert?genre=concert&subGenre=foreign`

    let html: string
    try {
      html = await fetchWithDelay(listUrl, 0)
    } catch (error) {
      console.error(`[Interpark] Failed to fetch list page: ${error}`)
      return []
    }

    const $ = cheerio.load(html)
    const results: CrawlResult[] = []
    const detailUrls: string[] = []

    // TODO: verify selector - list items on the category page
    $(
      '.prd-list li, .genre-list-item, .contents-list .item, [class*="ProductItem"]',
    ).each((_, el) => {
      // TODO: verify selector - link to detail page
      const linkEl = $(el)
        .find('a[href*="goods"], a[href*="product"], a[href*="detail"]')
        .first()
      const href = linkEl.attr('href')

      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`
        detailUrls.push(fullUrl)
      }
    })

    console.log(`[Interpark] Found ${detailUrls.length} listings`)

    for (const url of detailUrls) {
      try {
        const detail = await this.crawlDetail(url)
        if (detail) results.push(detail)
      } catch (error) {
        console.error(`[Interpark] Failed to crawl detail ${url}: ${error}`)
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
      console.error(`[Interpark] Failed to fetch detail page ${url}: ${error}`)
      return null
    }

    const $ = cheerio.load(html)

    const sourceId = extractSourceId(url)
    if (!sourceId) {
      console.warn(`[Interpark] Could not extract source ID from ${url}`)
      return null
    }

    // TODO: verify selector - performance title
    const rawTitle = (
      $('.prd-title').text() ||
      $('h1.product-title').text() ||
      $('meta[property="og:title"]').attr('content') ||
      ''
    ).trim()

    if (!rawTitle) return null

    // TODO: verify selector - date information
    const dateText = (
      $('.prd-info .date').text() ||
      $('[class*="infoItem"] .date').text() ||
      $('.product-info .period').text() ||
      ''
    ).trim()

    const dates = parseDateRange(dateText)
    if (!dates) return null

    // TODO: verify selector - venue
    const venue = (
      $('.prd-info .venue').text() ||
      $('[class*="infoItem"] .place').text() ||
      $('.product-info .location').text() ||
      ''
    ).trim()

    // TODO: verify selector - ticket open date
    const ticketOpenText = (
      $('.prd-info .ticket-open').text() ||
      $('[class*="infoItem"] .ticketOpen').text() ||
      ''
    ).trim()
    const ticketOpenAt = parseKoreanDate(ticketOpenText)

    // TODO: verify selector - presale date
    const presaleText = (
      $('.prd-info .presale').text() ||
      $('[class*="infoItem"] .presale').text() ||
      ''
    ).trim()
    const presaleOpenAt = parseKoreanDate(presaleText)

    // TODO: verify selector - price info
    const priceInfo = (
      $('.prd-info .price').text() ||
      $('[class*="infoItem"] .price').text() ||
      ''
    ).trim()

    // TODO: verify selector - poster/image
    const imageUrl =
      $('.prd-img img').attr('src') ||
      $('[class*="posterImage"] img').attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      undefined

    return {
      source: 'interpark',
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
 * Extract the performance/goods ID from an Interpark URL.
 */
function extractSourceId(url: string): string | null {
  // e.g. /goods/12345 or GoodsCode=12345 or /product/12345
  const goodsMatch = url.match(/\/goods\/(\w+)/i)
  if (goodsMatch) return goodsMatch[1]

  const codeMatch = url.match(/GoodsCode=(\w+)/i)
  if (codeMatch) return codeMatch[1]

  const productMatch = url.match(/\/product\/(\w+)/i)
  if (productMatch) return productMatch[1]

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
