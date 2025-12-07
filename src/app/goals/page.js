'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GOAL_TYPES = [
  { value: 'grade', label: '📊 Grade Goal', unit: '%', description: 'Target a specific grade in a class' },
  { value: 'study_hours', label: '⏰ Study Hours', unit: 'hours', description: 'Study a target number of hours' },
  { value: 'streak', label: '🔥 Streak Goal', unit: 'days', description: 'Maintain a study streak' },
  { value: 'habit', label: '✅ Habit Goal', unit: 'completions', description: 'Complete habits consistently' },
  { value: 'gpa', label: '🎓 GPA Goal', unit: 'points', description: 'Achieve a target GPA' },
  { value: 'custom', label: '🎯 Custom Goal', unit: '', description: 'Set a custom goal' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]

const STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress', icon: '🏃', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'completed', label: 'Completed', icon: '✅', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'paused', label: 'Paused', icon: '⏸️', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'failed', label: 'Failed', icon: '❌', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]

export default function GoalsPage() {
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState([])
  const [classes, setClasses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [milestoneInput, setMilestoneInput] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    goal_type: 'grade',
    target_value: '',
    current_value: 0,
    unit: '%',
    class_id: '',
    deadline: '',
    priority: 'medium',
    milestones: [],
    reward: '',
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      await Promise.all([
        loadGoals(),
        loadClasses(),
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGoals = async () => {
    const res = await fetch('/api/goals')
    if (res.ok) {
      const data = await res.json()
      setGoals(data)
    }
  }

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name, color, icon')
      .order('name')
    setClasses(data || [])
  }

  const saveGoal = async (e) => {
    e.preventDefault()
    try {
      const method = editingGoal ? 'PUT' : 'POST'
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals'

      const payload = {
        ...form,
        class_id: form.class_id || null,
        target_value: form.target_value ? parseFloat(form.target_value) : null,
        current_value: form.current_value ? parseFloat(form.current_value) : 0,
        deadline: form.deadline || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        loadGoals()
      }
    } catch (error) {
      console.error('Error saving goal:', error)
    }
  }

  const updateGoalProgress = async (goalId, newValue) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      const isCompleted = newValue >= goal.target_value

      await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_value: newValue,
          status: isCompleted ? 'completed' : 'in_progress',
        }),
      })

      loadGoals()
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const updateGoalStatus = async (goalId, status) => {
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      loadGoals()
    } catch (error) {
      console.error('Error updating goal status:', error)
    }
  }

  const deleteGoal = async (id) => {
    if (!confirm('Delete this goal?')) return

    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      loadGoals()
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const resetForm = () => {
    setEditingGoal(null)
    setForm({
      title: '',
      description: '',
      goal_type: 'grade',
      target_value: '',
      current_value: 0,
      unit: '%',
      class_id: '',
      deadline: '',
      priority: 'medium',
      milestones: [],
      reward: '',
    })
    setMilestoneInput('')
  }

  const addMilestone = () => {
    if (milestoneInput.trim()) {
      const milestone = {
        title: milestoneInput.trim(),
        target: form.milestones.length + 1,
        completed: false,
      }
      setForm({ ...form, milestones: [...form.milestones, milestone] })
      setMilestoneInput('')
    }
  }

  const toggleMilestone = (index) => {
    const milestones = [...form.milestones]
    milestones[index].completed = !milestones[index].completed
    setForm({ ...form, milestones })
  }

  const removeMilestone = (index) => {
    const milestones = [...form.milestones]
    milestones.splice(index, 1)
    setForm({ ...form, milestones })
  }

  const openEditModal = (goal) => {
    setEditingGoal(goal)
    setForm({
      title: goal.title,
      description: goal.description || '',
      goal_type: goal.goal_type,
      target_value: goal.target_value?.toString() || '',
      current_value: goal.current_value || 0,
      unit: goal.unit || '%',
      class_id: goal.class_id || '',
      deadline: goal.deadline || '',
      priority: goal.priority || 'medium',
      milestones: goal.milestones || [],
      reward: goal.reward || '',
    })
    setShowModal(true)
  }

  const getProgress = (goal) => {
    if (!goal.target_value) return 0
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
  }

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null
    const diff = new Date(deadline) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getTypeInfo = (type) => {
    return GOAL_TYPES.find(t => t.value === type) || GOAL_TYPES[0]
  }

  const getPriorityInfo = (priority) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1]
  }

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  }

  const filteredGoals = goals.filter(g => {
    if (filterStatus !== 'all' && g.status !== filterStatus) return false
    return true
  })

  const stats = {
    total: goals.length,
    inProgress: goals.filter(g => g.status === 'in_progress').length,
    completed: goals.filter(g => g.status === 'completed').length,
    avgProgress: goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + getProgress(g), 0) / goals.length)
      : 0,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Goals</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Goal
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
            <div className="text-indigo-100 text-sm">Total Goals</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-5 text-white shadow-lg">
            <div className="text-blue-100 text-sm">In Progress</div>
            <div className="text-3xl font-bold">{stats.inProgress}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-5 text-white shadow-lg">
            <div className="text-emerald-100 text-sm">Completed</div>
            <div className="text-3xl font-bold">{stats.completed}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-lg">
            <div className="text-amber-100 text-sm">Avg Progress</div>
            <div className="text-3xl font-bold">{stats.avgProgress}%</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All ({goals.length})
          </button>
          {STATUS_OPTIONS.map(status => {
            const count = goals.filter(g => g.status === status.value).length
            return (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filterStatus === status.value
                    ? status.color
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {status.icon} {status.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No goals yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Set your first academic goal to start tracking your progress
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map(goal => {
              const progress = getProgress(goal)
              const daysRemaining = getDaysRemaining(goal.deadline)
              const priorityInfo = getPriorityInfo(goal.priority)
              const statusInfo = getStatusInfo(goal.status)

              return (
                <div
                  key={goal.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm overflow-hidden transition-all hover:shadow-lg ${
                    goal.status === 'completed'
                      ? 'border-emerald-200 dark:border-emerald-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(goal)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                      {goal.title}
                    </h3>

                    {goal.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {goal.description}
                      </p>
                    )}

                    {goal.classes && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        📚 {goal.classes.name}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {goal.current_value || 0} / {goal.target_value} {goal.unit}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">{progress}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress >= 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : progress >= 75
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : progress >= 50
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-gradient-to-r from-pink-500 to-rose-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Progress Update */}
                    {goal.status === 'in_progress' && (
                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="number"
                          value={goal.current_value || ''}
                          onChange={e => updateGoalProgress(goal.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0"
                          min="0"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / {goal.target_value} {goal.unit}
                        </span>
                      </div>
                    )}

                    {/* Deadline */}
                    {goal.deadline && (
                      <div className={`text-sm mb-3 ${
                        daysRemaining !== null && daysRemaining < 0
                          ? 'text-red-500'
                          : daysRemaining !== null && daysRemaining <= 7
                          ? 'text-amber-500'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        📅 {daysRemaining !== null && daysRemaining < 0
                          ? `${Math.abs(daysRemaining)} days overdue`
                          : daysRemaining === 0
                          ? 'Due today!'
                          : daysRemaining === 1
                          ? 'Due tomorrow'
                          : `${daysRemaining} days left`
                        }
                      </div>
                    )}

                    {/* Milestones Preview */}
                    {goal.milestones && goal.milestones.length > 0 && (
                      <div className="text-sm">
                        <div className="text-gray-500 dark:text-gray-400 mb-1">
                          Milestones: {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length}
                        </div>
                        <div className="flex gap-1">
                          {goal.milestones.map((m, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                m.completed ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reward */}
                    {goal.reward && goal.status === 'completed' && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div className="text-sm text-amber-700 dark:text-amber-300">
                          🎁 Reward: {goal.reward}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      {goal.status !== 'completed' && (
                        <button
                          onClick={() => updateGoalStatus(goal.id, 'completed')}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        >
                          ✅ Complete
                        </button>
                      )}
                      {goal.status === 'in_progress' && (
                        <button
                          onClick={() => updateGoalStatus(goal.id, 'paused')}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        >
                          ⏸️ Pause
                        </button>
                      )}
                      {goal.status === 'paused' && (
                        <button
                          onClick={() => updateGoalStatus(goal.id, 'in_progress')}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          ▶️ Resume
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingGoal ? 'Edit Goal' : '🎯 New Goal'}
              </h2>

              <form onSubmit={saveGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Get an A in Math"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Type
                  </label>
                  <select
                    value={form.goal_type}
                    onChange={e => {
                      const type = GOAL_TYPES.find(t => t.value === e.target.value)
                      setForm({ ...form, goal_type: e.target.value, unit: type?.unit || '' })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {GOAL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Value
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        value={form.target_value}
                        onChange={e => setForm({ ...form, target_value: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="90"
                        required
                      />
                      <span className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-600 dark:text-gray-400">
                        {form.unit}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Value
                    </label>
                    <input
                      type="number"
                      value={form.current_value}
                      onChange={e => setForm({ ...form, current_value: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Class (optional)
                    </label>
                    <select
                      value={form.class_id}
                      onChange={e => setForm({ ...form, class_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select class...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline (optional)
                    </label>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={e => setForm({ ...form, deadline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {PRIORITIES.map(priority => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setForm({ ...form, priority: priority.value })}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          form.priority === priority.value
                            ? priority.color + ' ring-2 ring-offset-2 ring-gray-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="2"
                    placeholder="Why is this goal important to you?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Milestones (optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={milestoneInput}
                      onChange={e => setMilestoneInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add a milestone..."
                    />
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Add
                    </button>
                  </div>
                  {form.milestones.length > 0 && (
                    <ul className="space-y-2">
                      {form.milestones.map((milestone, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <button
                            type="button"
                            onClick={() => toggleMilestone(index)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              milestone.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {milestone.completed && '✓'}
                          </button>
                          <span className={`flex-1 ${milestone.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {milestone.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMilestone(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    🎁 Reward (optional)
                  </label>
                  <input
                    type="text"
                    value={form.reward}
                    onChange={e => setForm({ ...form, reward: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Treat yourself when you achieve this goal!"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingGoal ? 'Save Changes' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

