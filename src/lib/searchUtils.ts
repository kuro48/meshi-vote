/**
 * Converts katakana to hiragana so "ラーメン" and "らーめん" compare equal.
 */
function normalizeText(text: string): string {
  return text
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .toLowerCase()
    .trim()
}

/**
 * Returns the fraction of needle's bigrams that appear in haystack.
 * Falls back to plain includes for single-character needles.
 *
 * Examples:
 *   scoreToken("らめん", "らーめんやまだ") → 0.5  ("めん" matches, "らめ" doesn't)
 *   scoreToken("まくど", "まくどなるど")   → 1.0  ("まく" and "くど" both match)
 *   scoreToken("山田",   "らーめんやまだ") → 1.0  (exact substring)
 */
function scoreToken(needle: string, haystack: string): number {
  if (haystack.includes(needle)) return 1
  if (needle.length < 2) return 0

  const bigrams = Array.from(
    { length: needle.length - 1 },
    (_, i) => needle.slice(i, i + 2)
  )
  const matches = bigrams.filter((bg) => haystack.includes(bg)).length
  return matches / bigrams.length
}

/**
 * Searches items using kana-normalized bigram fuzzy matching.
 *
 * - Splits the query on whitespace for multi-word search ("山田 ラーメン")
 * - All tokens must meet the threshold (AND logic)
 * - Results sorted by weakest-token score descending
 */
export function searchItems<T>(
  items: T[],
  query: string,
  getText: (item: T) => string
): T[] {
  const trimmed = query.trim()
  if (!trimmed) return items

  const tokens = normalizeText(trimmed).split(/[\s　]+/).filter(Boolean)
  const THRESHOLD = 0.45

  const scored = items.flatMap((item) => {
    const text = normalizeText(getText(item))
    const scores = tokens.map((token) => scoreToken(token, text))
    const minScore = Math.min(...scores)
    return minScore >= THRESHOLD ? [{ item, minScore }] : []
  })

  return scored
    .sort((a, b) => b.minScore - a.minScore)
    .map(({ item }) => item)
}
