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
      setFlashcards(data)
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
        body: JSON.stringify({
          action: 'flashcards',
          topic,
          count,
          material: material || null
        })
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

  function startStudyMode(cards) {
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
      // End of deck
      setStudyMode(false)
    }
  }

  // Group flashcards by topic
  const groupedCards = flashcards.reduce((acc, card) => {
    const t = card.topic || 'General'
    if (!acc[t]) acc[t] = []
    acc[t].push(card)
    return acc
  }, {})

  if (studyMode && flashcards.length > 0) {
    const card = flashcards[currentIndex]
    const progress = ((currentIndex + 1) / flashcards.length) * 100

    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Progress */}
          <div className="w-full max-w-md mb-8">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span>✓ {score.correct} | ✗ {score.incorrect}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Card */}
          <div
            onClick={() => setFlipped(!flipped)}
            className="w-full max-w-md h-64 cursor-pointer perspective-1000"
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className={`absolute inset-0 rounded-xl border border-zinc-700 bg-zinc-900 p-6 flex items-center justify-center text-center backface-hidden ${flipped ? 'invisible' : ''}`}>
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Question</div>
                  <div className="text-xl">{card.front}</div>
                </div>
              </div>

              {/* Back */}
              <div className={`absolute inset-0 rounded-xl border border-zinc-700 bg-zinc-800 p-6 flex items-center justify-center text-center backface-hidden rotate-y-180 ${!flipped ? 'invisible' : ''}`}>
                <div>
                  <div className="text-xs text-zinc-500 mb-2">Answer</div>
                  <div className="text-xl text-green-400">{card.back}</div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-zinc-500 mt-4 mb-6">Click card to flip</p>

          {/* Buttons */}
          {flipped && (
            <div className="flex gap-4">
              <button
                onClick={() => handleNext(false)}
                className="px-6 py-3 bg-red-900/50 border border-red-700 rounded-lg font-medium hover:bg-red-900"
              >
                ✗ Didn't Know
              </button>
              <button
                onClick={() => handleNext(true)}
                className="px-6 py-3 bg-green-900/50 border border-green-700 rounded-lg font-medium hover:bg-green-900"
              >
                ✓ Got It
              </button>
            </div>
          )}

          <button
            onClick={() => setStudyMode(false)}
            className="mt-8 text-sm text-zinc-500 hover:text-white"
          >
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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">{percentage >= 70 ? '🎉' : '📚'}</div>
          <h2 className="text-2xl font-semibold mb-2">Study Session Complete!</h2>
          <div className="text-4xl font-bold mb-4">{percentage}%</div>
          <p className="text-zinc-400 mb-8">
            You got {score.correct} out of {total} cards correct
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => { setScore({ correct: 0, incorrect: 0 }); startStudyMode(flashcards) }}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium"
            >
              Study Again
            </button>
            <button
              onClick={() => setScore({ correct: 0, incorrect: 0 })}
              className="px-6 py-3 border border-zinc-700 rounded-lg"
            >
              Back to Cards
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Flashcards</h1>
        <p className="text-sm text-zinc-400 mb-6">Generate AI flashcards for any topic</p>

        {/* Generate Form */}
        <form onSubmit={handleGenerate} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 mb-8">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Topic</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Cell Biology, French Revolution, JavaScript Arrays..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Number of cards</label>
                <select
                  value={count}
                  onChange={e => setCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
                >
                  <option value={5}>5 cards</option>
                  <option value={10}>10 cards</option>
                  <option value={15}>15 cards</option>
                  <option value={20}>20 cards</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Study material <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                value={material}
                onChange={e => setMaterial(e.target.value)}
                placeholder="Paste notes or study material to base flashcards on..."
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Flashcards'}
            </button>
          </div>
        </form>

        {/* Flashcards List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
        ) : flashcards.length > 0 ? (
          <div className="space-y-8">
            {/* Study All Button */}
            <button
              onClick={() => startStudyMode(flashcards)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors"
            >
              🎴 Study All Cards ({flashcards.length})
            </button>

            {/* Grouped by Topic */}
            {Object.entries(groupedCards).map(([topicName, cards]) => (
              <div key={topicName}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{topicName}</h3>
                  <span className="text-sm text-zinc-500">{cards.length} cards</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {cards.slice(0, 6).map((card, i) => (
                    <div key={card.id || i} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                      <div className="text-sm text-zinc-400 mb-1">Q:</div>
                      <div className="mb-3">{card.front}</div>
                      <div className="text-sm text-zinc-400 mb-1">A:</div>
                      <div className="text-green-400">{card.back}</div>
                    </div>
                  ))}
                </div>
                {cards.length > 6 && (
                  <p className="text-sm text-zinc-500 mt-2">+ {cards.length - 6} more cards</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <div className="text-4xl mb-4">🗂️</div>
            <p>No flashcards yet. Generate some above!</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  )
}

