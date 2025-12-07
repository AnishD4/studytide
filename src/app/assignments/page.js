'use client'

import { useState, useEffect } from 'react'
import { inferEstimate, inferDifficulty } from '../../lib/estimate'

function formatTime(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export default function AssignmentsPage() {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  const combinedText = `${title} ${description}`
  const previewEstimate = inferEstimate(combinedText)
  const previewDifficulty = inferDifficulty(combinedText)

  async function handleAddAssignment(e) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueDate: dueDate || null, description })
      })
      const created = await response.json()
      setAssignments(prev => [created, ...prev])
      setTitle('')
      setDueDate('')
      setDescription('')
    } catch (error) {
      console.error('Failed to add assignment:', error)
    }
  }

  async function handleToggleComplete(id) {
    const assignment = assignments.find(a => a.id === id)
    if (!assignment) return

    try {
      const response = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !assignment.completed ? 1 : 0 })
      })
      const updated = await response.json()
      setAssignments(prev => prev.map(a => a.id === id ? updated : a))
    } catch (error) {
      console.error('Failed to toggle completion:', error)
    }
  }

  async function handleRemoveAssignment(id) {
    try {
      const response = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (response.ok) setAssignments(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('Failed to remove assignment:', error)
    }
  }

  async function handleAutoPrioritize() {
    try {
      await fetch('/api/study-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prioritize' })
      })
      const response = await fetch('/api/assignments')
      const data = await response.json()
      setAssignments(data)
    } catch (error) {
      console.error('Failed to prioritize:', error)
    }
  }

  useEffect(() => {
    async function fetchAssignments() {
      setLoading(true)
      try {
        const response = await fetch('/api/assignments')
        const data = await response.json()
        setAssignments(data)
      } catch (error) {
        console.error('Failed to fetch assignments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAssignments()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <main className="max-w-3xl mx-auto p-6 pt-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">📚 Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Track assignments with AI-estimated time and difficulty</p>

        <form onSubmit={handleAddAssignment} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-8 shadow-sm">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Enter assignment title"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Preview</label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">{previewDifficulty}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{formatTime(previewEstimate)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the assignment..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Add Assignment
            </button>
          </div>
        </form>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assignments ({assignments.length})</h2>
            {assignments.length > 0 && (
              <button onClick={handleAutoPrioritize} className="text-sm px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                🎯 Auto-Prioritize
              </button>
            )}
          </div>

          {loading && <p className="text-sm text-gray-500">Loading…</p>}
          {!loading && assignments.length === 0 && <p className="text-sm text-gray-500">No assignments yet.</p>}

          <ul className="space-y-3">
            {assignments.sort((a, b) => (b.priority || 5) - (a.priority || 5)).map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} onToggleComplete={handleToggleComplete} onRemove={handleRemoveAssignment} />
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

function AssignmentCard({ assignment, onToggleComplete, onRemove }) {
  const { id, title, dueDate, difficulty, estimatedMinutes, description, completed, priority } = assignment
  const displayDifficulty = difficulty ?? 5
  const displayPriority = priority ?? 5
  const priorityColor = displayPriority >= 8 ? 'bg-red-500' : displayPriority >= 5 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <li className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm ${completed ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start gap-4">
        <div className={`w-1 self-stretch rounded-full ${priorityColor}`}></div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
            <span className="text-gray-500">Due: {dueDate || '—'}</span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold">{displayDifficulty}</span>
              <span className="text-gray-400">diff</span>
            </span>
            <span className="text-gray-500">{formatTime(estimatedMinutes)}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${displayPriority >= 8 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : displayPriority >= 5 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
              P{displayPriority}
            </span>
          </div>
          {description && <p className={`mt-2 text-sm ${completed ? 'line-through text-gray-400' : 'text-gray-500'}`}>{description}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => onToggleComplete(id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${completed ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {completed ? '✓ Done' : 'Complete'}
          </button>
          <button onClick={() => onRemove(id)} className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Remove
          </button>
        </div>
      </div>
    </li>
  )
}
