/**
 * Client-side estimation utilities
 * Used for instant preview predictions before server-side AI processing
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Keywords mapped to estimated minutes */
const TIME_KEYWORDS = {
  essay: 60,
  research: 60,
  math: 30,
  worksheet: 30,
  lab: 90,
  reading: 30,
  presentation: 45,
  programming: 90,
  project: 120,
  coding: 90,
  'problem set': 60,
}

/** Keywords indicating harder tasks */
const HARD_KEYWORDS = [
  'implement', 'design', 'architect', 'integrate', 'optimi',
  'refactor', 'migrate', 'complex', 'research', 'setup',
  'configure', 'programming', 'coding', 'project'
]

/** Keywords indicating easier tasks */
const EASY_KEYWORDS = [
  'typo', 'read', 'review', 'docs', 'documentation',
  'cleanup', 'format', 'minor', 'test', 'write tests', 'proofread'
]

const MAX_MINUTES = 480 // 8 hours cap
const DEFAULT_MIN_MINUTES = 10

// ============================================================================
// ESTIMATE FUNCTIONS
// ============================================================================

/**
 * Infer estimated minutes from task text using keyword matching
 * @param {string} text - Task title and description
 * @returns {number} Estimated minutes to complete
 */
export function inferEstimate(text = '') {
  const lowerText = (text || '').toLowerCase()

  // Sum up minutes for each matching keyword
  let minutes = Object.entries(TIME_KEYWORDS)
    .filter(([keyword]) => lowerText.includes(keyword))
    .reduce((sum, [, value]) => sum + value, 0)

  // Fallback: word-count based estimate
  if (minutes === 0) {
    const wordCount = lowerText.trim().split(/\s+/).filter(Boolean).length
    minutes = Math.max(DEFAULT_MIN_MINUTES, Math.ceil((wordCount / 200) * 60))
  }

  return Math.min(minutes, MAX_MINUTES)
}

/**
 * Infer difficulty (1-10) from task text using keyword analysis
 * @param {string} text - Task title and description
 * @returns {number} Difficulty score 1-10
 */
export function inferDifficulty(text = '') {
  const lowerText = (text || '').toLowerCase()
  const wordCount = lowerText.split(/\s+/).filter(Boolean).length

  // Calculate score based on keywords
  let score = 0

  for (const keyword of HARD_KEYWORDS) {
    if (lowerText.includes(keyword)) score += 2
  }

  for (const keyword of EASY_KEYWORDS) {
    if (lowerText.includes(keyword)) score -= 1
  }

  // Add complexity for longer descriptions
  score += Math.min(5, Math.floor(wordCount / 50))

  // Base difficulty is 4, adjust by score
  let difficulty = 4 + score

  // Fine-tune based on text length
  if (wordCount > 200) difficulty += 1
  if (wordCount < 10) difficulty -= 1

  // Clamp to 1-10 range
  return Math.min(10, Math.max(1, difficulty))
}
