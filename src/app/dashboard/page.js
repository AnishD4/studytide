'use client'

import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [recommendation, setRecommendation] = useState(null)
  const [dailyPlan, setDailyPlan] = useState(null)
  const [availableTime, setAvailableTime] = useState(180)
  const [loading, setLoading] = useState({ recommendation: false, plan: false })
  const [error, setError] = useState(null)

  // Fetch "What should I study?" on load
  useEffect(() => {
    fetchRecommendation()
  }, [])

  async function fetchRecommendation() {
    setLoading(prev => ({ ...prev, recommendation: true }))
    setError(null)
    try {
      const res = await fetch('/api/study-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'what-to-study' })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRecommendation(data)
    } catch (err) {
      console.error('Error:', err)
      setRecommendation({ recommendation: "Add some assignments to get personalized study recommendations!" })
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
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setDailyPlan(data)
    } catch (err) {
      console.error('Error:', err)
      setDailyPlan({ greeting: "Add assignments first to generate a study plan!", tasks: [] })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <main className="max-w-4xl mx-auto p-6 pt-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">📊 Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Your personalized study hub</p>

        {/* What Should I Study? */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">📚 What Should I Study?</h2>
            <button onClick={fetchRecommendation} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Refresh</button>
          </div>

          {loading.recommendation ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center shadow-sm">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
              <p className="mt-2 text-gray-500">Analyzing your assignments...</p>
            </div>
          ) : recommendation ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <p className="text-lg mb-4 text-gray-900 dark:text-white">{recommendation.recommendation}</p>

              {recommendation.topPick && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Start with:</div>
                  <div className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{recommendation.topPick}</div>
                  {recommendation.reason && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{recommendation.reason}</div>}
                </div>
              )}

              {recommendation.urgent && recommendation.urgent.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-2">⚠️ Urgent:</div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.urgent.map((task, i) => (
                      <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-full text-sm text-red-700 dark:text-red-300">{task}</span>
                    ))}
                  </div>
                </div>
              )}

              {recommendation.motivation && <p className="text-sm text-gray-500 dark:text-gray-400 italic">💪 {recommendation.motivation}</p>}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm text-center text-gray-500">
              Add assignments to get study recommendations
            </div>
          )}
        </section>

        {/* Auto-Prioritize */}
        <section className="mb-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">🎯 AI Priority Sorting</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Let AI analyze your assignments and sort them by urgency.</p>
            <button onClick={handlePrioritize} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Auto-Prioritize My Assignments
            </button>
          </div>
        </section>

        {/* Daily Study Plan */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📅 Daily Study Plan</h2>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-end gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Available study time</label>
                <select value={availableTime} onChange={e => setAvailableTime(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none">
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={300}>5 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>
              <button onClick={fetchDailyPlan} disabled={loading.plan} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading.plan ? 'Generating...' : 'Generate Plan'}
              </button>
            </div>

            {dailyPlan && (
              <div className="space-y-4">
                {dailyPlan.greeting && <p className="text-lg text-gray-900 dark:text-white">{dailyPlan.greeting}</p>}

                {dailyPlan.focus && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                    <span className="text-gray-500 dark:text-gray-400">Today's focus: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{dailyPlan.focus}</span>
                  </div>
                )}

                {dailyPlan.tasks && dailyPlan.tasks.length > 0 && (
                  <div className="space-y-3">
                    {dailyPlan.tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">{i + 1}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{task.reason}</div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{task.duration} min</div>
                      </div>
                    ))}
                  </div>
                )}

                {dailyPlan.tip && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 text-sm">
                    💡 <span className="text-yellow-800 dark:text-yellow-200">{dailyPlan.tip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-4">
          <a href="/flashcards" className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors shadow-sm">
            <div className="text-2xl mb-2">🗂️</div>
            <div className="font-semibold text-gray-900 dark:text-white">Flashcards</div>
            <div className="text-sm text-gray-500">Create & review flashcards</div>
          </a>
          <a href="/study-guides" className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors shadow-sm">
            <div className="text-2xl mb-2">📖</div>
            <div className="font-semibold text-gray-900 dark:text-white">Study Guides</div>
            <div className="text-sm text-gray-500">Generate study guides</div>
          </a>
        </section>
      </main>
    </div>
  )
}
