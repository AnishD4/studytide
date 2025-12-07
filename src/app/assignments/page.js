'use client'

import { useState, useEffect } from 'react'
import { inferEstimate, inferDifficulty } from '../../lib/estimate'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format minutes into human-readable time string
 * @param {number} minutes
 * @returns {string} Formatted time (e.g., "1h 30m" or "45m")
 */
function formatTime(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AssignmentsPage() {
  // Form state
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  // Data state
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  // Live preview predictions (client-side)
  const combinedText = `${title} ${description}`
  const previewEstimate = inferEstimate(combinedText)
  const previewDifficulty = inferDifficulty(combinedText)

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  async function handleAddAssignment(e) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          dueDate: dueDate || null,
          description
        })
      })

      const created = await response.json()
      setAssignments(prev => [created, ...prev])

      // Reset form
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

      if (response.ok) {
        setAssignments(prev => prev.filter(a => a.id !== id))
      }
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
      // Refresh assignments to get new priorities
      const response = await fetch('/api/assignments')
      const data = await response.json()
      setAssignments(data)
    } catch (error) {
      console.error('Failed to prioritize:', error)
    }
  }

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <h1 className="text-2xl font-semibold mb-2">Assignments</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Create assignments with due date, difficulty, estimated time and description.
        </p>

        {/* Add Assignment Form */}
        <form onSubmit={handleAddAssignment} className="grid gap-4 mb-8">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Enter assignment title"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            />
          </div>

          {/* Due Date & Preview Row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:border-white focus:outline-none"
              />
            </div>

            {/* Live Preview */}
            <div className="w-44">
              <label className="block text-sm font-medium mb-1">Preview</label>
              <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold">
                  {previewDifficulty}
                </span>
                <span className="text-sm text-zinc-300">
                  {formatTime(previewEstimate)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the assignment..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-white focus:outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors"
          >
            Add Assignment
          </button>
        </form>

        {/* Assignments List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">
              Assignments ({assignments.length})
            </h2>
            {assignments.length > 0 && (
              <button
                onClick={handleAutoPrioritize}
                className="text-sm px-3 py-1 rounded-lg border border-zinc-700 hover:border-zinc-500"
              >
                🎯 Auto-Prioritize
              </button>
            )}
          </div>

          {loading && <p className="text-sm text-zinc-400">Loading…</p>}

          {!loading && assignments.length === 0 && (
            <p className="text-sm text-zinc-400">No assignments yet.</p>
          )}

          <ul className="space-y-3">
            {assignments
              .sort((a, b) => (b.priority || 5) - (a.priority || 5))
              .map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onToggleComplete={handleToggleComplete}
                onRemove={handleRemoveAssignment}
              />
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Individual assignment card component
 */
function AssignmentCard({ assignment, onToggleComplete, onRemove }) {
  const { id, title, dueDate, difficulty, estimatedMinutes, description, completed, priority } = assignment
  const displayDifficulty = difficulty ?? 5
  const displayPriority = priority ?? 5

  // Priority color
  const priorityColor = displayPriority >= 8 ? 'bg-red-500' : displayPriority >= 5 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <li className={`rounded-lg border border-zinc-700 bg-zinc-900 p-4 ${completed ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start gap-4">
        {/* Priority indicator */}
        <div className={`w-1 self-stretch rounded-full ${priorityColor}`}></div>

        {/* Assignment Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${completed ? 'line-through text-zinc-500' : 'text-white'}`}>
            {title}
          </h3>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
            <span className="text-zinc-400">Due: {dueDate || '—'}</span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold">
                {displayDifficulty}
              </span>
              <span className="text-zinc-500">diff</span>
            </span>
            <span className="text-zinc-400">{formatTime(estimatedMinutes)}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              displayPriority >= 8 ? 'bg-red-900/50 text-red-300' : 
              displayPriority >= 5 ? 'bg-yellow-900/50 text-yellow-300' : 
              'bg-green-900/50 text-green-300'
            }`}>
              P{displayPriority}
            </span>
          </div>

          {description && (
            <p className={`mt-2 text-sm ${completed ? 'line-through text-zinc-600' : 'text-zinc-400'}`}>
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onToggleComplete(id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              completed 
                ? 'bg-green-600 text-white' 
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            {completed ? '✓ Done' : 'Complete'}
          </button>
          <button
            onClick={() => onRemove(id)}
            className="px-3 py-1.5 rounded-md text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  )
}
