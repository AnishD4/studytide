import { NextResponse } from 'next/server'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/**
 * Generate a test using Gemini AI
 */
async function generateTest(topic, questionCount = 5, focusAreas = null, studyMaterial = null) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  let focusText = ''
  if (focusAreas?.length) {
    focusText = `
IMPORTANT: The student got these questions wrong previously. Create NEW, SIMILAR questions 
that test the same concepts but with different wording/scenarios:
${focusAreas.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Generate questions that help them practice these specific weak areas.`
  }

  let materialText = ''
  if (studyMaterial) {
    materialText = `
BASE YOUR QUESTIONS ON THIS STUDY MATERIAL:
---
${studyMaterial}
---
Only ask questions about content covered in this material.`
  }

  const prompt = `Create a ${questionCount}-question multiple choice test about: ${topic}
${focusText}
${materialText}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct",
      "subtopic": "The specific subtopic this question covers"
    }
  ]
}

correctAnswer is the index (0-3) of the correct option.
subtopic helps identify what concept this tests.
Make questions challenging but fair. Vary difficulty.`

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.7 }
      })
    })

    const data = await res.json()
    if (data.error) {
      console.error('Gemini error:', data.error)
      return null
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('Test generation error:', err)
    return null
  }
}

/**
 * Chat with AI about the entire test
 */
async function chatAboutTest(testData, userAnswers, message, studyMaterial = null) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const testSummary = testData.questions.map((q, i) => {
    const userAns = userAnswers[q.id]
    const isCorrect = userAns === q.correctAnswer
    return `Q${i + 1}: ${q.question}
Options: ${q.options.join(' | ')}
Student answered: ${q.options[userAns] || 'Not answered'}
Correct: ${q.options[q.correctAnswer]}
Result: ${isCorrect ? '✓ Correct' : '✗ Wrong'}
Subtopic: ${q.subtopic || 'General'}`
  }).join('\n\n')

  const materialContext = studyMaterial
    ? `\nSTUDY MATERIAL PROVIDED:\n${studyMaterial.substring(0, 2000)}...\n`
    : ''

  const prompt = `You are a helpful tutor. A student just completed a test and wants help.

TEST TOPIC: ${testData.topic}
${materialContext}
TEST RESULTS:
${testSummary}

STUDENT'S QUESTION: ${message}

Provide a helpful, encouraging response. Reference specific questions and the study material when relevant.`

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
      })
    })

    const data = await res.json()
    if (data.error) return null

    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch (err) {
    console.error('Chat error:', err)
    return null
  }
}

/**
 * POST /api/tests - Generate a new test or get AI help
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'generate') {
      const { topic, questionCount, focusAreas, studyMaterial } = body
      if (!topic && !studyMaterial) {
        return NextResponse.json({ error: 'Topic or study material is required' }, { status: 400 })
      }

      const test = await generateTest(
        topic || 'the provided study material',
        questionCount || 5,
        focusAreas,
        studyMaterial
      )

      if (!test) {
        return NextResponse.json({ error: 'Failed to generate test' }, { status: 500 })
      }

      return NextResponse.json({ ...test, topic: topic || 'Study Material Review' })
    }

    if (action === 'chat') {
      const { testData, userAnswers, message, studyMaterial } = body
      const response = await chatAboutTest(testData, userAnswers, message, studyMaterial)
      if (!response) {
        return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
      }
      return NextResponse.json({ response })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
