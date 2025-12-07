import { NextResponse } from 'next/server'
import db from '../../../lib/db'

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DIFFICULTY = 5
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Reference table for AI estimation
const ESTIMATION_PROMPT = `You estimate academic tasks. Use this reference:

| Task Type | Minutes | Difficulty |
|-----------|---------|------------|
| Math Worksheet | 20 | 3 |
| Reading Assignment | 30 | 2 |
| Short Essay (1-2 pages) | 90 | 4 |
| Lab Report | 90 | 5 |
| Long Essay (3-5 pages) | 240 | 6 |
| Programming Project | 60 | 7 |
| Research Paper | 1200 | 8 |
| Group Project | 300 | 6 |

Task: TASK_HERE

Reply with ONLY two numbers: minutes,difficulty`

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns a date string (YYYY-MM-DD) for 2 days from now
 */
function getDefaultDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 2)
  return date.toISOString().split('T')[0]
}

/**
 * Calls Gemini AI to estimate task duration and difficulty
 */
async function getAIEstimate(title, description = '') {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set!')
    return null
  }

  console.log('🔑 API Key found, calling Gemini...')

  const taskInfo = description ? `${title}: ${description}` : title
  const prompt = ESTIMATION_PROMPT.replace('TASK_HERE', taskInfo)

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0 }
      })
    })

    const data = await res.json()
    console.log('📦 Gemini response:', JSON.stringify(data, null, 2))

    if (data.error) {
      console.error('❌ Gemini API error:', data.error)
      return null
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('📝 Raw AI text:', text)

    // Extract two numbers from the response
    const numbers = text.match(/\d+/g)
    console.log('🔢 Extracted numbers:', numbers)

    if (numbers && numbers.length >= 2) {
      const minutes = Math.min(1440, Math.max(5, parseInt(numbers[0], 10)))
      const difficulty = Math.min(10, Math.max(1, parseInt(numbers[1], 10)))
      console.log('✅ Parsed result:', { minutes, difficulty })
      return { minutes, difficulty }
    }

    if (numbers && numbers.length === 1) {
      const minutes = Math.min(1440, Math.max(5, parseInt(numbers[0], 10)))
      console.log('⚠️ Only got minutes:', minutes)
      return { minutes, difficulty: DEFAULT_DIFFICULTY }
    }

    console.warn('❌ Could not extract numbers from:', text)
    return null

  } catch (err) {
    console.error('❌ Fetch error:', err.message)
    return null
  }
}

/**
 * Fallback estimate when AI is unavailable
 */
function getFallbackEstimate(text = '') {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length
  // Base 30 minutes + 2 minutes per word, rounded to nearest 5
  const minutes = Math.max(30, Math.round((30 + words * 2) / 5) * 5)
  return Math.min(480, minutes)
}

/**
 * Format assignment row from database
 */
function formatAssignment(row) {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.dueDate,
    difficulty: row.difficulty ?? DEFAULT_DIFFICULTY,
    estimatedMinutes: row.estimatedMinutes,
    description: row.description,
    completed: Boolean(row.completed)
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/assignments - Fetch all assignments
 */
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM assignments ORDER BY id DESC').all()
    return NextResponse.json(rows.map(formatAssignment))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/assignments - Create new assignment
 */
export async function POST(request) {
  try {
    const { title, dueDate, description } = await request.json()

    // Default due date: 2 days from now
    const finalDueDate = dueDate || getDefaultDueDate()

    // Get AI estimate with title and description
    const aiResult = await getAIEstimate(title, description)

    // Use AI values or fallbacks
    const minutes = aiResult?.minutes ?? getFallbackEstimate(`${title} ${description || ''}`)
    const difficulty = aiResult?.difficulty ?? DEFAULT_DIFFICULTY

    console.log('Assignment created:', { title, minutes, difficulty, finalDueDate })

    // Insert into database
    const stmt = db.prepare(`
      INSERT INTO assignments (title, dueDate, difficulty, estimatedMinutes, description, completed)
      VALUES (?, ?, ?, ?, ?, 0)
    `)
    const result = stmt.run(title, finalDueDate, difficulty, minutes, description || null)

    // Return created assignment
    return NextResponse.json({
      id: result.lastInsertRowid,
      title,
      dueDate: finalDueDate,
      difficulty,
      estimatedMinutes: minutes,
      description: description || null,
      completed: false
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/assignments - Update assignment completion status
 */
export async function PATCH(request) {
  try {
    const { id, completed } = await request.json()

    db.prepare('UPDATE assignments SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id)

    const row = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id)
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(formatAssignment(row))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/assignments - Remove assignment
 */
export async function DELETE(request) {
  try {
    const { id } = await request.json()
    db.prepare('DELETE FROM assignments WHERE id = ?').run(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
