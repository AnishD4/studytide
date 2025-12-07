'use client'

import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [recommendation, setRecommendation] = useState(null)
  const [dailyPlan, setDailyPlan] = useState(null)
  const [availableTime, setAvailableTime] = useState(180)
  const [loading, setLoading] = useState({ recommendation: true, plan: false })

  // Fetch "What should I study?" on load
  useEffect(() => {
    fetchRecommendation()
  }, [])

  async function fetchRecommendation() {
    setLoading(prev => ({ ...prev, recommendation: true }))
    try {
      const res = await fetch('/api/study-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'what-to-study' })
      })
      const data = await res.json()
      setRecommendation(data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(prev => ({ ...prev, recommendation: false }))
    }
  }

  async function fetchDailyPlan() {
    setLoading(prev => ({ ...prev, plan: true }))
    try {
      const res = await fetch('/api/study-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'daily-plan', availableMinutes: availableTime })
      })
      const data = await res.json()
      setDailyPlan(data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(prev => ({ ...prev, plan: false }))
    }
  }

  async function handlePrioritize() {
    try {
      await fetch('/api/study-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prioritize' })
      })
      fetchRecommendation()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-sm text-zinc-400 mb-8">Your personalized study hub</p>

        {/* What Should I Study? */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">📚 What Should I Study?</h2>
            <button
              onClick={fetchRecommendation}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Refresh
            </button>
          </div>

          {loading.recommendation ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              <p className="mt-2 text-zinc-400">Analyzing your assignments...</p>
            </div>
          ) : recommendation ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-lg mb-4">{recommendation.recommendation}</p>

              {recommendation.topPick && (
                <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                  <div className="text-sm text-zinc-400 mb-1">Start with:</div>
                  <div className="text-xl font-semibold text-green-400">{recommendation.topPick}</div>
                  {recommendation.reason && (
                    <div className="text-sm text-zinc-400 mt-1">{recommendation.reason}</div>
                  )}
                </div>
              )}

              {recommendation.urgent && recommendation.urgent.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-red-400 mb-2">⚠️ Urgent:</div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.urgent.map((task, i) => (
                      <span key={i} className="px-3 py-1 bg-red-900/30 border border-red-800 rounded-full text-sm">
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recommendation.motivation && (
                <p className="text-sm text-zinc-400 italic">💪 {recommendation.motivation}</p>
              )}
            </div>
          ) : null}
        </section>

        {/* Auto-Prioritize */}
        <section className="mb-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-medium mb-2">🎯 AI Priority Sorting</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Let AI analyze your assignments and sort them by urgency based on due dates, difficulty, and time needed.
            </p>
            <button
              onClick={handlePrioritize}
              className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200"
            >
              Auto-Prioritize My Assignments
            </button>
          </div>
        </section>

        {/* Daily Study Plan */}
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-4">📅 Daily Study Plan</h2>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-end gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm text-zinc-400 mb-1">Available study time</label>
                <select
                  value={availableTime}
                  onChange={e => setAvailableTime(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white"
                >
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={300}>5 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>
              <button
                onClick={fetchDailyPlan}
                disabled={loading.plan}
                className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading.plan ? 'Generating...' : 'Generate Plan'}
              </button>
            </div>

            {dailyPlan && (
              <div className="space-y-4">
                {dailyPlan.greeting && (
                  <p className="text-lg">{dailyPlan.greeting}</p>
                )}

                {dailyPlan.focus && (
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <span className="text-zinc-400">Today's focus: </span>
                    <span className="font-medium">{dailyPlan.focus}</span>
                  </div>
                )}

                {dailyPlan.tasks && dailyPlan.tasks.length > 0 && (
                  <div className="space-y-3">
                    {dailyPlan.tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-zinc-400">{task.reason}</div>
                        </div>
                        <div className="text-sm text-zinc-400">
                          {task.duration} min
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dailyPlan.tip && (
                  <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 text-sm">
                    💡 <span className="text-yellow-200">{dailyPlan.tip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-4">
          <a
            href="/flashcards"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 transition-colors"
          >
            <div className="text-2xl mb-2">🗂️</div>
            <div className="font-medium">Flashcards</div>
            <div className="text-sm text-zinc-400">Create & review flashcards</div>
          </a>
          <a
            href="/study-guides"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 transition-colors"
          >
            <div className="text-2xl mb-2">📖</div>
            <div className="font-medium">Study Guides</div>
            <div className="text-sm text-zinc-400">Generate study guides</div>
          </a>
        </section>
      </main>
    </div>
  )
}

