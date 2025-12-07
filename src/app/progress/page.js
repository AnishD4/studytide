'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const HABIT_ICONS = [
  { name: 'Book', value: '📚' },
  { name: 'Brain', value: '🧠' },
  { name: 'Clock', value: '⏰' },
  { name: 'Star', value: '⭐' },
  { name: 'Fire', value: '🔥' },
  { name: 'Target', value: '🎯' },
  { name: 'Notes', value: '📝' },
  { name: 'Laptop', value: '💻' },
  { name: 'Running', value: '🏃' },
  { name: 'Sleep', value: '😴' },
  { name: 'Water', value: '💧' },
  { name: 'Meditation', value: '🧘' },
]

const HABIT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#22c55e', '#14b8a6', '#3b82f6',
]

const MOOD_EMOJIS = [
  { value: 1, emoji: '😢', label: 'Awful' },
  { value: 2, emoji: '😔', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

export default function ProgressPage() {
  const [loading, setLoading] = useState(true)
  const [streaks, setStreaks] = useState({})
  const [habits, setHabits] = useState([])
  const [todayCheckin, setTodayCheckin] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [showHabitModal, setShowHabitModal] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [classes, setClasses] = useState([])
  const [editingHabit, setEditingHabit] = useState(null)

  const [habitForm, setHabitForm] = useState({
    name: '',
    description: '',
    icon: '📚',
    color: '#6366f1',
    target_frequency: 'daily',
    target_count: 1,
    reminder_time: '',
  })

  const [checkinForm, setCheckinForm] = useState({
    mood: 3,
    energy_level: 3,
    productivity_rating: 3,
    sleep_hours: 7,
    main_focus: '',
    blockers: [],
    wins: [],
    gratitude: '',
  })

  const [sessionForm, setSessionForm] = useState({
    class_id: '',
    duration_minutes: 30,
    session_type: 'study',
    focus_score: 3,
    notes: '',
    topics_covered: [],
  })

  const router = useRouter()
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      await Promise.all([
        loadStreaks(),
        loadHabits(),
        loadTodayCheckin(),
        loadRecentSessions(),
        loadClasses(),
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStreaks = async () => {
    const res = await fetch('/api/streaks')
    if (res.ok) {
      const data = await res.json()
      setStreaks(data)
    }
  }

  const loadHabits = async () => {
    const res = await fetch('/api/habits')
    if (res.ok) {
      const data = await res.json()
      setHabits(data)
    }
  }

  const loadTodayCheckin = async () => {
    const res = await fetch(`/api/daily-checkins?date=${today}`)
    if (res.ok) {
      const data = await res.json()
      if (data) {
        setTodayCheckin(data)
        setCheckinForm({
          mood: data.mood || 3,
          energy_level: data.energy_level || 3,
          productivity_rating: data.productivity_rating || 3,
          sleep_hours: data.sleep_hours || 7,
          main_focus: data.main_focus || '',
          blockers: data.blockers || [],
          wins: data.wins || [],
          gratitude: data.gratitude || '',
        })
      }
    }
  }

  const loadRecentSessions = async () => {
    const res = await fetch('/api/study-sessions')
    if (res.ok) {
      const data = await res.json()
      setRecentSessions(data.slice(0, 5))
    }
  }

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name, color, icon')
      .order('name')
    setClasses(data || [])
  }

  const isHabitCompletedToday = (habit) => {
    return habit.habit_completions?.some(c => c.date === today)
  }

  const toggleHabitCompletion = async (habitId) => {
    try {
      await fetch(`/api/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
      })
      loadHabits()
      loadStreaks()
    } catch (error) {
      console.error('Error toggling habit:', error)
    }
  }

  const saveHabit = async (e) => {
    e.preventDefault()
    try {
      const method = editingHabit ? 'PUT' : 'POST'
      const url = editingHabit ? `/api/habits/${editingHabit.id}` : '/api/habits'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitForm),
      })

      if (res.ok) {
        setShowHabitModal(false)
        setEditingHabit(null)
        setHabitForm({
          name: '',
          description: '',
          icon: '📚',
          color: '#6366f1',
          target_frequency: 'daily',
          target_count: 1,
          reminder_time: '',
        })
        loadHabits()
      }
    } catch (error) {
      console.error('Error saving habit:', error)
    }
  }

  const deleteHabit = async (habitId) => {
    if (!confirm('Delete this habit? All completion history will be lost.')) return

    try {
      await fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
      loadHabits()
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  const saveCheckin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/daily-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkinForm, date: today }),
      })

      if (res.ok) {
        setShowCheckinModal(false)
        loadTodayCheckin()
        loadStreaks()
      }
    } catch (error) {
      console.error('Error saving check-in:', error)
    }
  }

  const saveSession = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sessionForm,
          class_id: sessionForm.class_id || null,
          date: today,
        }),
      })

      if (res.ok) {
        setShowSessionModal(false)
        setSessionForm({
          class_id: '',
          duration_minutes: 30,
          session_type: 'study',
          focus_score: 3,
          notes: '',
          topics_covered: [],
        })
        loadRecentSessions()
        loadStreaks()
      }
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const getWeekDays = () => {
    const days = []
    const current = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(current)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }

  const getHabitCompletionsForWeek = (habit) => {
    const weekDays = getWeekDays()
    return weekDays.map(day => ({
      date: day,
      completed: habit.habit_completions?.some(c => c.date === day),
    }))
  }

  const completedHabitsToday = habits.filter(isHabitCompletedToday).length

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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Progress & Habits</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSessionModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Log Study Session
              </button>
              <button
                onClick={() => setShowHabitModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Habit
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Streak Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-100">🔥 Study Streak</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Best: {streaks.study?.longest_streak || 0}</span>
            </div>
            <div className="text-4xl font-bold">{streaks.study?.current_streak || 0}</div>
            <div className="text-orange-200 text-sm mt-1">days in a row</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">✨ Habit Streak</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Best: {streaks.habit?.longest_streak || 0}</span>
            </div>
            <div className="text-4xl font-bold">{streaks.habit?.current_streak || 0}</div>
            <div className="text-purple-200 text-sm mt-1">days in a row</div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-teal-100">📅 Login Streak</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Best: {streaks.login?.longest_streak || 0}</span>
            </div>
            <div className="text-4xl font-bold">{streaks.login?.current_streak || 0}</div>
            <div className="text-teal-200 text-sm mt-1">days in a row</div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-pink-100">✅ Today's Habits</span>
            </div>
            <div className="text-4xl font-bold">{completedHabitsToday}/{habits.length}</div>
            <div className="text-pink-200 text-sm mt-1">
              {habits.length > 0 ? `${Math.round((completedHabitsToday / habits.length) * 100)}% complete` : 'No habits yet'}
            </div>
          </div>
        </div>

        {/* Daily Check-in Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🌅</span> Daily Check-in
            </h2>
            <button
              onClick={() => setShowCheckinModal(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
            >
              {todayCheckin ? 'Update' : 'Check in now →'}
            </button>
          </div>

          {todayCheckin ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-3xl mb-1">{MOOD_EMOJIS.find(m => m.value === todayCheckin.mood)?.emoji || '😐'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Mood</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-amber-500">{todayCheckin.energy_level}/5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Energy</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-emerald-500">{todayCheckin.productivity_rating}/5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Productivity</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-indigo-500">{todayCheckin.sleep_hours}h</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sleep</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🌤️</div>
              <p>Start your day with a quick check-in!</p>
              <p className="text-sm">Track your mood, energy, and set your focus for today.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Habits Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🎯</span> Daily Habits
              </h2>

              {habits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📚</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No habits yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first habit to start building consistency</p>
                  <button
                    onClick={() => setShowHabitModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create First Habit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {habits.map(habit => {
                    const weekData = getHabitCompletionsForWeek(habit)
                    const isCompleted = isHabitCompletedToday(habit)

                    return (
                      <div
                        key={habit.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isCompleted
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleHabitCompletion(habit.id)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                                isCompleted
                                  ? 'bg-green-500 text-white scale-110'
                                  : 'bg-white dark:bg-gray-600 border-2'
                              }`}
                              style={{ borderColor: !isCompleted ? habit.color : undefined }}
                            >
                              {isCompleted ? '✓' : habit.icon}
                            </button>
                            <div>
                              <h3 className={`font-medium ${isCompleted ? 'text-green-700 dark:text-green-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                {habit.name}
                              </h3>
                              {habit.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{habit.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Week streak visualization */}
                            <div className="hidden sm:flex gap-1">
                              {weekData.map((day) => (
                                <div
                                  key={day.date}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                                    day.completed
                                      ? 'bg-green-500 text-white'
                                      : day.date === today
                                      ? 'border-2 border-dashed border-gray-300 dark:border-gray-500'
                                      : 'bg-gray-200 dark:bg-gray-600'
                                  }`}
                                  title={new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                >
                                  {day.completed && '✓'}
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingHabit(habit)
                                  setHabitForm({
                                    name: habit.name,
                                    description: habit.description || '',
                                    icon: habit.icon,
                                    color: habit.color,
                                    target_frequency: habit.target_frequency,
                                    target_count: habit.target_count,
                                    reminder_time: habit.reminder_time || '',
                                  })
                                  setShowHabitModal(true)
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteHabit(habit.id)}
                                className="p-2 text-gray-400 hover:text-red-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Study Sessions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📖</span> Recent Study Sessions
              </h2>

              {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏱️</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No study sessions logged yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map(session => (
                    <div key={session.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {session.classes?.name || 'General Study'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(session.date).toLocaleDateString()} • {session.duration_minutes} min
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(session.focus_score || 0)].map((_, i) => (
                            <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {session.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{session.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/reflections"
                  className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
                >
                  <span>View Reflections</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="mt-3">
                <Link
                  href="/goals"
                  className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
                >
                  <span>View Goals</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Habit Modal */}
      {showHabitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </h2>

              <form onSubmit={saveHabit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    value={habitForm.name}
                    onChange={e => setHabitForm({ ...habitForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Read for 20 minutes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={habitForm.description}
                    onChange={e => setHabitForm({ ...habitForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Any subject or topic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_ICONS.map(icon => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setHabitForm({ ...habitForm, icon: icon.value })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                          habitForm.icon === icon.value
                            ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {icon.value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {HABIT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setHabitForm({ ...habitForm, color })}
                        className={`w-8 h-8 rounded-full transition-all ${
                          habitForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={habitForm.target_frequency}
                    onChange={e => setHabitForm({ ...habitForm, target_frequency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays only</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHabitModal(false)
                      setEditingHabit(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingHabit ? 'Save Changes' : 'Create Habit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Daily Check-in Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🌅 Daily Check-in
              </h2>

              <form onSubmit={saveCheckin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    How are you feeling today?
                  </label>
                  <div className="flex justify-between">
                    {MOOD_EMOJIS.map(mood => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setCheckinForm({ ...checkinForm, mood: mood.value })}
                        className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                          checkinForm.mood === mood.value
                            ? 'bg-indigo-100 dark:bg-indigo-900 scale-110'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{mood.emoji}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Energy Level: {checkinForm.energy_level}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={checkinForm.energy_level}
                    onChange={e => setCheckinForm({ ...checkinForm, energy_level: parseInt(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hours of Sleep
                  </label>
                  <input
                    type="number"
                    value={checkinForm.sleep_hours}
                    onChange={e => setCheckinForm({ ...checkinForm, sleep_hours: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                    max="24"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Main Focus for Today
                  </label>
                  <input
                    type="text"
                    value={checkinForm.main_focus}
                    onChange={e => setCheckinForm({ ...checkinForm, main_focus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="What's your #1 priority today?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gratitude (optional)
                  </label>
                  <input
                    type="text"
                    value={checkinForm.gratitude}
                    onChange={e => setCheckinForm({ ...checkinForm, gratitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="One thing you're grateful for..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCheckinModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Check-in
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Study Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📖 Log Study Session
              </h2>

              <form onSubmit={saveSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class (optional)
                  </label>
                  <select
                    value={sessionForm.class_id}
                    onChange={e => setSessionForm({ ...sessionForm, class_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">General Study</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={sessionForm.duration_minutes}
                    onChange={e => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Session Type
                  </label>
                  <select
                    value={sessionForm.session_type}
                    onChange={e => setSessionForm({ ...sessionForm, session_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="study">Study</option>
                    <option value="review">Review</option>
                    <option value="practice">Practice</option>
                    <option value="homework">Homework</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Focus Score: {sessionForm.focus_score}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={sessionForm.focus_score}
                    onChange={e => setSessionForm({ ...sessionForm, focus_score: parseInt(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={sessionForm.notes}
                    onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="3"
                    placeholder="What did you work on?"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSessionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Log Session
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

