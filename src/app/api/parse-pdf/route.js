import { NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Use Gemini to extract text from PDF
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Extract ALL text content from this PDF document. Return ONLY the extracted text, preserving paragraphs and structure. Do not summarize or modify the content.'
            },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          maxOutputTokens: 8000,
          temperature: 0
        }
      })
    })

    const data = await response.json()

    if (data.error) {
      console.error('Gemini error:', data.error)
      return NextResponse.json({
        error: 'Failed to process PDF: ' + data.error.message
      }, { status: 500 })
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        error: 'No text could be extracted from the PDF.'
      }, { status: 400 })
    }

    return NextResponse.json({
      text: text.trim(),
      pages: 0
    })

  } catch (error) {
    console.error('PDF parse error:', error)
    return NextResponse.json({
      error: 'Failed to parse PDF: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}
