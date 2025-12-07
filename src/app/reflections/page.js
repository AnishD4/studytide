'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const REFLECTION_TYPES = [
  { value: 'assignment', label: '📝 Assignment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'test', label: '📋 Test', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'quiz', label: '❓ Quiz', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'project', label: '🎯 Project', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'weekly', label: '📅 Weekly', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'monthly', label: '📊 Monthly', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
]

const STUDY_METHODS = [
  { value: 'flashcards', label: '🗂️ Flashcards' },
  { value: 'notes', label: '📝 Notes Review' },
  { value: 'practice', label: '✍️ Practice Problems' },
  { value: 'group', label: '👥 Group Study' },
  { value: 'video', label: '📺 Video Lessons' },
  { value: 'textbook', label: '📖 Textbook' },
  { value: 'tutoring', label: '👨‍🏫 Tutoring' },
  { value: 'other', label: '🔧 Other' },
]

const CONFIDENCE_LEVELS = [
  { value: 1, emoji: '😰', label: 'Very Low' },
  { value: 2, emoji: '😟', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Confident' },
  { value: 5, emoji: '😎', label: 'Very Confident' },
]

export default function ReflectionsPage() {
  const [loading, setLoading] = useState(true)
  const [reflections, setReflections] = useState([])
  const [classes, setClasses] = useState([])
  const [grades, setGrades] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingReflection, setEditingReflection] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterClass, setFilterClass] = useState('all')

  const [form, setForm] = useState({
    title: '',
    reflection_type: 'assignment',
    class_id: '',
    grade_id: '',
    date: new Date().toISOString().split('T')[0],
    expected_score: '',
    actual_score: '',
    what_went_well: '',
    what_to_improve: '',
    study_hours_spent: '',
    study_method: 'notes',
    started_studying_days_before: '',
    confidence_before: 3,
    confidence_after: 3,
    stress_level: 3,
    action_items: [],
    lessons_learned: '',
    is_completed: false,
  })

  const [actionItemInput, setActionItemInput] = useState('')

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
        loadReflections(),
        loadClasses(),
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReflections = async () => {
    const res = await fetch('/api/reflections')
    if (res.ok) {
      const data = await res.json()
      setReflections(data)
    }
  }

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name, color, icon')
      .order('name')
    setClasses(data || [])
  }

  const loadGradesForClass = async (classId) => {
    if (!classId) {
      setGrades([])
      return
    }
    const { data } = await supabase
      .from('grades')
      .select('id, name, score, max_score, category')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
    setGrades(data || [])
  }

  const saveReflection = async (e) => {
    e.preventDefault()
    try {
      const method = editingReflection ? 'PUT' : 'POST'
      const url = editingReflection ? `/api/reflections/${editingReflection.id}` : '/api/reflections'

      const payload = {
        ...form,
        class_id: form.class_id || null,
        grade_id: form.grade_id || null,
        expected_score: form.expected_score ? parseFloat(form.expected_score) : null,
        actual_score: form.actual_score ? parseFloat(form.actual_score) : null,
        study_hours_spent: form.study_hours_spent ? parseFloat(form.study_hours_spent) : null,
        started_studying_days_before: form.started_studying_days_before ? parseInt(form.started_studying_days_before) : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        loadReflections()
      }
    } catch (error) {
      console.error('Error saving reflection:', error)
    }
  }

  const deleteReflection = async (id) => {
    if (!confirm('Delete this reflection?')) return

    try {
      await fetch(`/api/reflections/${id}`, { method: 'DELETE' })
      loadReflections()
    } catch (error) {
      console.error('Error deleting reflection:', error)
    }
  }

  const resetForm = () => {
    setEditingReflection(null)
    setForm({
      title: '',
      reflection_type: 'assignment',
      class_id: '',
      grade_id: '',
      date: new Date().toISOString().split('T')[0],
      expected_score: '',
      actual_score: '',
      what_went_well: '',
      what_to_improve: '',
      study_hours_spent: '',
      study_method: 'notes',
      started_studying_days_before: '',
      confidence_before: 3,
      confidence_after: 3,
      stress_level: 3,
      action_items: [],
      lessons_learned: '',
      is_completed: false,
    })
    setGrades([])
    setActionItemInput('')
  }

  const addActionItem = () => {
    if (actionItemInput.trim()) {
      setForm({ ...form, action_items: [...form.action_items, actionItemInput.trim()] })
      setActionItemInput('')
    }
  }

  const removeActionItem = (index) => {
    const items = [...form.action_items]
    items.splice(index, 1)
    setForm({ ...form, action_items: items })
  }

  const openEditModal = (reflection) => {
    setEditingReflection(reflection)
    setForm({
      title: reflection.title,
      reflection_type: reflection.reflection_type,
      class_id: reflection.class_id || '',
      grade_id: reflection.grade_id || '',
      date: reflection.date,
      expected_score: reflection.expected_score?.toString() || '',
      actual_score: reflection.actual_score?.toString() || '',
      what_went_well: reflection.what_went_well || '',
      what_to_improve: reflection.what_to_improve || '',
      study_hours_spent: reflection.study_hours_spent?.toString() || '',
      study_method: reflection.study_method || 'notes',
      started_studying_days_before: reflection.started_studying_days_before?.toString() || '',
      confidence_before: reflection.confidence_before || 3,
      confidence_after: reflection.confidence_after || 3,
      stress_level: reflection.stress_level || 3,
      action_items: reflection.action_items || [],
      lessons_learned: reflection.lessons_learned || '',
      is_completed: reflection.is_completed || false,
    })
    if (reflection.class_id) {
      loadGradesForClass(reflection.class_id)
    }
    setShowModal(true)
  }

  const getTypeInfo = (type) => {
    return REFLECTION_TYPES.find(t => t.value === type) || REFLECTION_TYPES[0]
  }

  const filteredReflections = reflections.filter(r => {
    if (filterType !== 'all' && r.reflection_type !== filterType) return false
    if (filterClass !== 'all' && r.class_id !== filterClass) return false
    return true
  })

  const stats = {
    total: reflections.length,
    completed: reflections.filter(r => r.is_completed).length,
    avgConfidenceGain: reflections.length > 0
      ? (reflections.reduce((sum, r) => sum + ((r.confidence_after || 0) - (r.confidence_before || 0)), 0) / reflections.length).toFixed(1)
      : 0,
    avgStudyHours: reflections.filter(r => r.study_hours_spent).length > 0
      ? (reflections.filter(r => r.study_hours_spent).reduce((sum, r) => sum + (r.study_hours_spent || 0), 0) / reflections.filter(r => r.study_hours_spent).length).toFixed(1)
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reflections</h1>
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
                New Reflection
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Reflections</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence Gain</div>
            <div className="text-2xl font-bold text-purple-600">
              {parseFloat(stats.avgConfidenceGain) >= 0 ? '+' : ''}{stats.avgConfidenceGain}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Study Hours</div>
            <div className="text-2xl font-bold text-blue-600">{stats.avgStudyHours}h</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            {REFLECTION_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Reflections List */}
        {filteredReflections.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">🪞</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reflections yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start reflecting on your tests and assignments to improve your study habits
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Your First Reflection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReflections.map(reflection => {
              const typeInfo = getTypeInfo(reflection.reflection_type)
              const scoreImprovement = reflection.actual_score && reflection.expected_score
                ? reflection.actual_score - reflection.expected_score
                : null

              return (
                <div
                  key={reflection.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {reflection.classes && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {reflection.classes.name}
                          </span>
                        )}
                        {reflection.is_completed && (
                          <span className="text-emerald-500 text-sm">✓ Completed</span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {reflection.title}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {new Date(reflection.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {reflection.actual_score !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">Score:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {reflection.actual_score}
                              {scoreImprovement !== null && (
                                <span className={`ml-1 ${scoreImprovement >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  ({scoreImprovement >= 0 ? '+' : ''}{scoreImprovement.toFixed(1)})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {reflection.study_hours_spent && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">Study:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{reflection.study_hours_spent}h</span>
                          </div>
                        )}
                        {reflection.confidence_after && reflection.confidence_before && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {CONFIDENCE_LEVELS.find(c => c.value === reflection.confidence_before)?.emoji}
                              → {CONFIDENCE_LEVELS.find(c => c.value === reflection.confidence_after)?.emoji}
                            </span>
                          </div>
                        )}
                      </div>

                      {reflection.lessons_learned && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                          💡 {reflection.lessons_learned}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(reflection)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteReflection(reflection.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Reflection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingReflection ? 'Edit Reflection' : '🪞 New Reflection'}
              </h2>

              <form onSubmit={saveReflection} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Chapter 5 Test"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={form.reflection_type}
                      onChange={e => setForm({ ...form, reflection_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {REFLECTION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Class
                    </label>
                    <select
                      value={form.class_id}
                      onChange={e => {
                        setForm({ ...form, class_id: e.target.value, grade_id: '' })
                        loadGradesForClass(e.target.value)
                      }}
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
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {grades.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link to Grade (optional)
                    </label>
                    <select
                      value={form.grade_id}
                      onChange={e => {
                        const grade = grades.find(g => g.id === e.target.value)
                        setForm({
                          ...form,
                          grade_id: e.target.value,
                          title: grade ? grade.name : form.title,
                          actual_score: grade ? ((grade.score / grade.max_score) * 100).toFixed(1) : form.actual_score,
                        })
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a grade...</option>
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.score}/{g.max_score})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">📊 Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expected Score (%)
                      </label>
                      <input
                        type="number"
                        value={form.expected_score}
                        onChange={e => setForm({ ...form, expected_score: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="85"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Actual Score (%)
                      </label>
                      <input
                        type="number"
                        value={form.actual_score}
                        onChange={e => setForm({ ...form, actual_score: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="88"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">📚 Study Habits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hours Studied
                      </label>
                      <input
                        type="number"
                        value={form.study_hours_spent}
                        onChange={e => setForm({ ...form, study_hours_spent: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="3"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Study Method
                      </label>
                      <select
                        value={form.study_method}
                        onChange={e => setForm({ ...form, study_method: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {STUDY_METHODS.map(method => (
                          <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Started Days Before
                      </label>
                      <input
                        type="number"
                        value={form.started_studying_days_before}
                        onChange={e => setForm({ ...form, started_studying_days_before: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="3"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">😊 Confidence & Stress</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confidence Before: {CONFIDENCE_LEVELS.find(c => c.value === form.confidence_before)?.emoji}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={form.confidence_before}
                        onChange={e => setForm({ ...form, confidence_before: parseInt(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confidence After: {CONFIDENCE_LEVELS.find(c => c.value === form.confidence_after)?.emoji}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={form.confidence_after}
                        onChange={e => setForm({ ...form, confidence_after: parseInt(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stress Level: {form.stress_level}/5
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={form.stress_level}
                        onChange={e => setForm({ ...form, stress_level: parseInt(e.target.value) })}
                        className="w-full accent-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">💭 Reflection</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        What went well?
                      </label>
                      <textarea
                        value={form.what_went_well}
                        onChange={e => setForm({ ...form, what_went_well: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows="2"
                        placeholder="I understood the main concepts..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        What could be improved?
                      </label>
                      <textarea
                        value={form.what_to_improve}
                        onChange={e => setForm({ ...form, what_to_improve: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows="2"
                        placeholder="I should have practiced more problems..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Key Lesson Learned
                      </label>
                      <textarea
                        value={form.lessons_learned}
                        onChange={e => setForm({ ...form, lessons_learned: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows="2"
                        placeholder="Starting earlier makes a big difference..."
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">✅ Action Items</h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={actionItemInput}
                      onChange={e => setActionItemInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addActionItem())}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add an action item..."
                    />
                    <button
                      type="button"
                      onClick={addActionItem}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Add
                    </button>
                  </div>
                  {form.action_items.length > 0 && (
                    <ul className="space-y-2">
                      {form.action_items.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <span className="text-emerald-500">•</span>
                          <span className="flex-1 text-gray-700 dark:text-gray-300">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeActionItem(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_completed}
                      onChange={e => setForm({ ...form, is_completed: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mark as completed</span>
                  </label>
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
                    {editingReflection ? 'Save Changes' : 'Create Reflection'}
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

