import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  try {
    const response = await callGemini(prompt, 500)
    if (response) {
      const match = response.match(/\[[\d,\s]+\]/)
      if (match) {
        return JSON.parse(match[0])
      }
    }
  } catch (err) {
    console.error('Gemini error:', err)
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

  try {
    const response = await callGemini(prompt, 1000)
    if (response) {
      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        return JSON.parse(match[0])
      }
    }
  } catch (err) {
    console.error('Gemini error:', err)
  }
  return { greeting: "Let's study! 🌊", tasks: incomplete.slice(0, 3).map(a => ({ title: a.title, duration: a.estimatedMinutes || 30, reason: "Priority task" })), tip: "Take breaks every 25 minutes." }
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

  try {
    const response = await callGemini(prompt, 2000)
    if (response) {
      const match = response.match(/\[[\s\S]*\]/)
      if (match) {
        return JSON.parse(match[0])
      }
    }
  } catch (err) {
    console.error('Gemini error:', err)
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

  try {
    const response = await callGemini(prompt, 800)
    if (response) {
      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        return JSON.parse(match[0])
      }
    }
  } catch (err) {
    console.error('Gemini error:', err)
  }

  // Fallback response when AI is unavailable
  return {
    recommendation: "Start with your most urgent assignment!",
    urgent: incomplete.filter(a => a.dueDate && new Date(a.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).map(a => a.title),
    topPick: incomplete[0]?.title || "Check your assignments",
    reason: "This is your highest priority task",
    motivation: "You've got this! One task at a time. 🌊"
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, topic, material, count, availableMinutes } = await request.json()

    if (action === 'prioritize') {
      // Note: Assignments table doesn't exist in your schema yet
      // You'll need to create it or this will return empty
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)

      const priorities = await calculatePriorities(assignments || [])

      // Update priorities in database
      if (assignments && assignments.length > 0) {
        for (let i = 0; i < assignments.length; i++) {
          await supabase
            .from('assignments')
            .update({ priority: priorities[i] || 5 })
            .eq('id', assignments[i].id)
        }
      }

      return NextResponse.json({ success: true, priorities })
    }

    if (action === 'daily-plan') {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('priority', { ascending: false })

      const plan = await generateStudyPlan(assignments || [], availableMinutes || 180)
      return NextResponse.json(plan)
    }

    if (action === 'study-guide') {
      if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 })
      const guide = await generateStudyGuide(topic, material)

      // Save to database - you'll need to create this table
      await supabase
        .from('study_guides')
        .insert({ user_id: user.id, topic, content: guide })

      return NextResponse.json({ guide })
    }

    if (action === 'flashcards') {
      if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 })
      const flashcards = await generateFlashcards(topic, count || 10, material)

      // Save to database - you'll need to create this table
      const cardsToInsert = flashcards.map(card => ({
        user_id: user.id,
        topic,
        front: card.front,
        back: card.back
      }))

      await supabase.from('flashcards').insert(cardsToInsert)

      return NextResponse.json({ flashcards })
    }

    if (action === 'what-to-study') {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('priority', { ascending: false })

      const recommendation = await getStudyRecommendation(assignments || [])
      return NextResponse.json(recommendation)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Study tools error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'flashcards') {
      const topic = searchParams.get('topic')
      let query = supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false })

      if (topic) {
        query = query.eq('topic', topic)
      } else {
        query = query.limit(100)
      }

      const { data: cards } = await query
      return NextResponse.json(cards || [])
    }

    if (type === 'study-guides') {
      const { data: guides } = await supabase
        .from('study_guides')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false })

      return NextResponse.json(guides || [])
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Study tools GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

