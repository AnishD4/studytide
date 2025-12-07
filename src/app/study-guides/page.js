'use client'

import { useState, useEffect, useRef } from 'react'

export default function StudyGuidesPage() {
  const [topic, setTopic] = useState('')
  const [material, setMaterial] = useState('')
  const [fileName, setFileName] = useState('')
  const [guides, setGuides] = useState([])
  const [currentGuide, setCurrentGuide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchGuides()
  }, [])

  async function fetchGuides() {
    setLoading(true)
    try {
      const res = await fetch('/api/study-tools?type=study-guides')
      const data = await res.json()
      setGuides(data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    if (file.name.toLowerCase().endsWith('.pdf')) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.text) setMaterial(data.text)
      } catch (err) {
        console.error('PDF error:', err)
      }
    } else {
      const text = await file.text()
      setMaterial(text)
    }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!topic.trim()) return

    setGenerating(true)
    try {
      const res = await fetch('/api/study-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'study-guide',
          topic,
          material: material || null
        })
      })
      const data = await res.json()
      if (data.guide) {
        const newGuide = { id: Date.now(), topic, content: data.guide, createdAt: new Date().toISOString() }
        setGuides(prev => [newGuide, ...prev])
        setCurrentGuide(newGuide)
        setTopic('')
        setMaterial('')
        setFileName('')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setGenerating(false)
    }
  }

  // Format guide content with markdown-like rendering
  function formatContent(content) {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{line.slice(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="ml-4 mb-1">• {line.slice(2)}</li>
        }
        if (line.match(/^\d+\. /)) {
          return <li key={i} className="ml-4 mb-1">{line}</li>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-bold mb-2">{line.slice(2, -2)}</p>
        }
        if (line.trim() === '') {
          return <br key={i} />
        }
        return <p key={i} className="mb-2">{line}</p>
      })
  }

  if (currentGuide) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => setCurrentGuide(null)}
            className="mb-6 text-sm text-zinc-400 hover:text-white flex items-center gap-2"
          >
            ← Back to Study Guides
          </button>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
            <h1 className="text-2xl font-bold mb-2">{currentGuide.topic}</h1>
            <p className="text-sm text-zinc-500 mb-6">
              Generated {new Date(currentGuide.createdAt).toLocaleDateString()}
            </p>

            <div className="prose prose-invert max-w-none">
              {formatContent(currentGuide.content)}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Study Guides</h1>
        <p className="text-sm text-zinc-400 mb-6">Generate comprehensive study guides for any topic</p>

        {/* Generate Form */}
        <form onSubmit={handleGenerate} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 mb-8">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Topic</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, World War I, Machine Learning Basics..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Source material <span className="text-zinc-500">(optional)</span>
              </label>

              {!material ? (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-zinc-500"
                  >
                    <p className="text-sm text-zinc-400">Upload PDF or text file</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <textarea
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    placeholder="Or paste notes here..."
                    rows={3}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none resize-none"
                  />
                </div>
              ) : (
                <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{fileName || 'Pasted content'} ({material.length.toLocaleString()} chars)</span>
                    <button
                      type="button"
                      onClick={() => { setMaterial(''); setFileName('') }}
                      className="text-red-400 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={generating}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50"
            >
              {generating ? 'Generating Study Guide...' : 'Generate Study Guide'}
            </button>
          </div>
        </form>

        {/* Guides List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
        ) : guides.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Your Study Guides</h2>
            {guides.map(guide => (
              <button
                key={guide.id}
                onClick={() => setCurrentGuide(guide)}
                className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-colors"
              >
                <div className="font-medium">{guide.topic}</div>
                <div className="text-sm text-zinc-500">
                  {new Date(guide.createdAt).toLocaleDateString()} • {guide.content.length.toLocaleString()} chars
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <div className="text-4xl mb-4">📖</div>
            <p>No study guides yet. Generate one above!</p>
          </div>
        )}
      </main>
    </div>
  )
}

