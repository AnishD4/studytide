import { NextResponse } from 'next/server'
import db from '../../../lib/db'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

async function callGemini(prompt, maxTokens = 4000) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
    })
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * AI Priority Sorting - Calculate priority based on due date, difficulty, and time needed
 */
async function calculatePriorities(assignments) {
  const today = new Date()

  const prompt = `You are a study priority assistant. Analyze these assignments and assign priority scores (1-10, where 10 is most urgent).

Consider:
- Due date urgency (closer = higher priority)
- Difficulty level (harder tasks need more time, start earlier)
- Estimated time (longer tasks should start sooner)
- Today's date: ${today.toISOString().split('T')[0]}

Assignments:
${assignments.map((a, i) => `${i + 1}. "${a.title}" - Due: ${a.dueDate || 'No date'}, Difficulty: ${a.difficulty}/10, Est. time: ${a.estimatedMinutes} mins`).join('\n')}

Return ONLY a JSON array of priority scores in the same order: [score1, score2, ...]`

  const response = await callGemini(prompt, 500)
  const match = response.match(/\[[\d,\s]+\]/)
  if (match) {
    return JSON.parse(match[0])
  }
  return assignments.map(() => 5)
}

/**
 * Generate Daily Study Plan
 */
async function generateStudyPlan(assignments, availableMinutes = 180) {
  const incomplete = assignments.filter(a => !a.completed)
  if (incomplete.length === 0) return { message: 'No assignments to study!', tasks: [] }

  const prompt = `Create a focused daily study plan for a student.

Available study time: ${availableMinutes} minutes
Today's date: ${new Date().toISOString().split('T')[0]}

Assignments (sorted by priority):
${incomplete.map((a, i) => `${i + 1}. "${a.title}" - Due: ${a.dueDate || 'No date'}, Difficulty: ${a.difficulty}/10, Est. ${a.estimatedMinutes} mins, Priority: ${a.priority}/10`).join('\n')}

Create a realistic study schedule. Return JSON:
{
  "greeting": "Encouraging personalized greeting",
  "focus": "Main focus area for today",
  "tasks": [
    {"title": "Task name", "duration": minutes, "reason": "Why this task now"}
  ],
  "tip": "Study tip for today"
}`

  const response = await callGemini(prompt, 1000)
  const match = response.match(/\{[\s\S]*\}/)
  if (match) {
    return JSON.parse(match[0])
  }
  return { greeting: "Let's study!", tasks: [], tip: "Take breaks every 25 minutes." }
}

/**
 * Generate Study Guide
 */
async function generateStudyGuide(topic, material = null) {
  const materialContext = material ? `\nStudy Material:\n${material.substring(0, 5000)}` : ''

  const prompt = `Create a comprehensive study guide for: ${topic}
${materialContext}

Include:
1. Key Concepts Overview
2. Important Terms & Definitions
3. Main Topics Breakdown
4. Common Mistakes to Avoid
5. Quick Review Summary
6. Practice Questions (3-5)

Format with clear headings and bullet points. Make it scannable and easy to review.`

  return await callGemini(prompt, 3000)
}

/**
 * Generate Flashcards
 */
async function generateFlashcards(topic, count = 10, material = null) {
  const materialContext = material ? `\nBased on this material:\n${material.substring(0, 5000)}` : ''

  const prompt = `Create ${count} flashcards for studying: ${topic}
${materialContext}

Return ONLY JSON array:
[
  {"front": "Question or term", "back": "Answer or definition"},
  ...
]

Make cards focused and testable. Include a mix of:
- Definitions
- Concepts
- Applications
- Comparisons`

  const response = await callGemini(prompt, 2000)
  const match = response.match(/\[[\s\S]*\]/)
  if (match) {
    return JSON.parse(match[0])
  }
  return []
}

/**
 * What Should I Study Today?
 */
async function getStudyRecommendation(assignments) {
  const incomplete = assignments.filter(a => !a.completed)
  if (incomplete.length === 0) {
    return {
      recommendation: "🎉 You're all caught up! No pending assignments.",
      urgent: [],
      suggestion: "Review past material or get ahead on upcoming topics."
    }
  }

  const prompt = `As a study advisor, analyze these assignments and give a quick recommendation.

Today: ${new Date().toISOString().split('T')[0]}

Assignments:
${incomplete.map((a, i) => `- "${a.title}" Due: ${a.dueDate || 'No date'}, Difficulty: ${a.difficulty}/10, Time: ${a.estimatedMinutes} mins`).join('\n')}

Return JSON:
{
  "recommendation": "Brief, friendly recommendation (1-2 sentences)",
  "urgent": ["List of urgent task titles"],
  "topPick": "The single most important task to start with",
  "reason": "Why this task first",
  "motivation": "Brief motivational message"
}`

  const response = await callGemini(prompt, 800)
  const match = response.match(/\{[\s\S]*\}/)
  if (match) {
    return JSON.parse(match[0])
  }
  return { recommendation: "Start with your most urgent assignment!", urgent: [], topPick: incomplete[0]?.title }
}

export async function POST(request) {
  try {
    const { action, topic, material, count, availableMinutes } = await request.json()

    if (action === 'prioritize') {
      const assignments = db.prepare('SELECT * FROM assignments WHERE completed = 0').all()
      const priorities = await calculatePriorities(assignments)

      // Update priorities in database
      const updateStmt = db.prepare('UPDATE assignments SET priority = ? WHERE id = ?')
      assignments.forEach((a, i) => {
        updateStmt.run(priorities[i] || 5, a.id)
      })

      return NextResponse.json({ success: true, priorities })
    }

    if (action === 'daily-plan') {
      const assignments = db.prepare('SELECT * FROM assignments WHERE completed = 0 ORDER BY priority DESC').all()
      const plan = await generateStudyPlan(assignments, availableMinutes || 180)
      return NextResponse.json(plan)
    }

    if (action === 'study-guide') {
      if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 })
      const guide = await generateStudyGuide(topic, material)

      // Save to database
      db.prepare('INSERT INTO study_guides (topic, content) VALUES (?, ?)').run(topic, guide)

      return NextResponse.json({ guide })
    }

    if (action === 'flashcards') {
      if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 })
      const flashcards = await generateFlashcards(topic, count || 10, material)

      // Save to database
      const insertStmt = db.prepare('INSERT INTO flashcards (topic, front, back) VALUES (?, ?, ?)')
      flashcards.forEach(card => {
        insertStmt.run(topic, card.front, card.back)
      })

      return NextResponse.json({ flashcards })
    }

    if (action === 'what-to-study') {
      const assignments = db.prepare('SELECT * FROM assignments WHERE completed = 0 ORDER BY priority DESC').all()
      const recommendation = await getStudyRecommendation(assignments)
      return NextResponse.json(recommendation)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Study tools error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'flashcards') {
    const topic = searchParams.get('topic')
    const cards = topic
      ? db.prepare('SELECT * FROM flashcards WHERE topic = ? ORDER BY id DESC').all(topic)
      : db.prepare('SELECT * FROM flashcards ORDER BY id DESC LIMIT 100').all()
    return NextResponse.json(cards)
  }

  if (type === 'study-guides') {
    const guides = db.prepare('SELECT * FROM study_guides ORDER BY id DESC').all()
    return NextResponse.json(guides)
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

