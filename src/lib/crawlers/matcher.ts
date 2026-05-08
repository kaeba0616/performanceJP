export interface ArtistKeyword {
  ko: string
  en: string
  ja: string
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
    if (kw.ko && title.includes(kw.ko)) return kw
    if (kw.en && lowerTitle.includes(kw.en.toLowerCase())) return kw
    if (kw.ja && title.includes(kw.ja)) return kw
  }

  return null
}

/**
 * Detect whether a string contains Japanese hiragana or katakana characters.
 * (Hiragana U+3040–U+309F, Katakana U+30A0–U+30FF)
 */
export function hasJapaneseCharacters(text: string): boolean {
  return /[぀-ゟ゠-ヿ]/.test(text)
}
