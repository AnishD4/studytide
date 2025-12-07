'use client'

import { useState, useEffect } from 'react'

export default function FlashcardsPage() {
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(10)
  const [material, setMaterial] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Study mode state
  const [studyMode, setStudyMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })

  useEffect(() => {
    fetchFlashcards()
  }, [])

  async function fetchFlashcards() {
    setLoading(true)
    try {
      const res = await fetch('/api/study-tools?type=flashcards')
      const data = await res.json()
      if (Array.isArray(data)) {
        setFlashcards(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
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
        body: JSON.stringify({ action: 'flashcards', topic, count, material: material || null })
      })
      const data = await res.json()
      if (data.flashcards) {
        setFlashcards(prev => [...data.flashcards.map((f, i) => ({ ...f, id: Date.now() + i, topic })), ...prev])
        setTopic('')
        setMaterial('')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setGenerating(false)
    }
  }

  function startStudyMode() {
    if (flashcards.length === 0) return
    setStudyMode(true)
    setCurrentIndex(0)
    setFlipped(false)
    setScore({ correct: 0, incorrect: 0 })
  }

  function handleNext(correct) {
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }))

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setFlipped(false)
    } else {
      setStudyMode(false)
    }
  }

  const groupedCards = flashcards.reduce((acc, card) => {
    const t = card.topic || 'General'
    if (!acc[t]) acc[t] = []
    acc[t].push(card)
    return acc
  }, {})

  // Study Mode View
  if (studyMode && flashcards.length > 0) {
    const card = flashcards[currentIndex]
    const progress = ((currentIndex + 1) / flashcards.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
        <main className="flex-1 flex flex-col items-center justify-center p-6 pt-20">
          <div className="w-full max-w-md mb-8">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span>✓ {score.correct} | ✗ {score.incorrect}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div onClick={() => setFlipped(!flipped)} className="w-full max-w-md h-64 cursor-pointer">
            <div className={`relative w-full h-full transition-all duration-300 ${flipped ? 'scale-95' : ''}`}>
              <div className={`absolute inset-0 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center text-center shadow-lg ${flipped ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-white dark:bg-gray-800'}`}>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{flipped ? 'Answer' : 'Question'}</div>
                  <div className={`text-xl ${flipped ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                    {flipped ? card.back : card.front}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 mb-6">Click card to flip</p>

          {flipped && (
            <div className="flex gap-4">
              <button onClick={() => handleNext(false)} className="px-6 py-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50">
                ✗ Didn't Know
              </button>
              <button onClick={() => handleNext(true)} className="px-6 py-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-xl font-medium hover:bg-green-200 dark:hover:bg-green-900/50">
                ✓ Got It
              </button>
            </div>
          )}

          <button onClick={() => setStudyMode(false)} className="mt-8 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
            Exit Study Mode
          </button>
        </main>
      </div>
    )
  }

  // Score Summary
  if (!studyMode && score.correct + score.incorrect > 0) {
    const total = score.correct + score.incorrect
    const percentage = Math.round((score.correct / total) * 100)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">{percentage >= 70 ? '🎉' : '📚'}</div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Study Session Complete!</h2>
          <div className="text-4xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">{percentage}%</div>
          <p className="text-gray-600 dark:text-gray-400 mb-8">You got {score.correct} out of {total} cards correct</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => { setScore({ correct: 0, incorrect: 0 }); startStudyMode() }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
              Study Again
            </button>
            <button onClick={() => setScore({ correct: 0, incorrect: 0 })} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              Back to Cards
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <main className="max-w-4xl mx-auto p-6 pt-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">🗂️ Flashcards</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Generate AI flashcards for any topic</p>

        <form onSubmit={handleGenerate} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-8 shadow-sm">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Topic</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Cell Biology, French Revolution..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Number of cards</label>
              <select value={count} onChange={e => setCount(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none">
                <option value={5}>5 cards</option>
                <option value={10}>10 cards</option>
                <option value={15}>15 cards</option>
                <option value={20}>20 cards</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Study material <span className="text-gray-500">(optional)</span></label>
              <textarea
                value={material}
                onChange={e => setMaterial(e.target.value)}
                placeholder="Paste notes to base flashcards on..."
                rows={3}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <button type="submit" disabled={generating} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {generating ? 'Generating...' : 'Generate Flashcards'}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : flashcards.length > 0 ? (
          <div className="space-y-8">
            <button onClick={startStudyMode} className="w-full py-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium">
              🎴 Study All Cards ({flashcards.length})
            </button>

            {Object.entries(groupedCards).map(([topicName, cards]) => (
              <div key={topicName}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{topicName}</h3>
                  <span className="text-sm text-gray-500">{cards.length} cards</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {cards.slice(0, 6).map((card, i) => (
                    <div key={card.id || i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Q:</div>
                      <div className="mb-3 text-gray-900 dark:text-white">{card.front}</div>
                      <div className="text-sm text-gray-500 mb-1">A:</div>
                      <div className="text-indigo-600 dark:text-indigo-400">{card.back}</div>
                    </div>
                  ))}
                </div>
                {cards.length > 6 && <p className="text-sm text-gray-500 mt-2">+ {cards.length - 6} more cards</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🗂️</div>
            <p>No flashcards yet. Generate some above!</p>
          </div>
        )}
      </main>
    </div>
  )
}
