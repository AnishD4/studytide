'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CLASS_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
]

const CLASS_ICONS = [
  { name: 'Book', value: 'book', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { name: 'Calculator', value: 'calculator', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { name: 'Beaker', value: 'beaker', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { name: 'Globe', value: 'globe', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Code', value: 'code', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { name: 'Music', value: 'music', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
  { name: 'Pencil', value: 'pencil', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  { name: 'Language', value: 'language', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
]

export default function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    room: '',
    color: '#6366f1',
    icon: 'book',
    credits: 3.0,
    target_grade: 90,
  })
  const [saving, setSaving] = useState(false)
  const [gpaData, setGpaData] = useState({ gpa: 0, totalCredits: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    calculateGPA()
  }, [classes])

  const loadClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          grades (id, score, max_score, weight)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateGPA = () => {
    if (classes.length === 0) {
      setGpaData({ gpa: 0, totalCredits: 0 })
      return
    }

    let totalPoints = 0
    let totalCredits = 0

    classes.forEach(cls => {
      if (cls.current_grade !== null && cls.credits) {
        const gradePoint = getGradePoint(cls.current_grade)
        totalPoints += gradePoint * cls.credits
        totalCredits += cls.credits
      }
    })

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0
    setGpaData({ gpa, totalCredits })
  }

  const getGradePoint = (percentage) => {
    if (percentage >= 93) return 4.0
    if (percentage >= 90) return 3.7
    if (percentage >= 87) return 3.3
    if (percentage >= 83) return 3.0
    if (percentage >= 80) return 2.7
    if (percentage >= 77) return 2.3
    if (percentage >= 73) return 2.0
    if (percentage >= 70) return 1.7
    if (percentage >= 67) return 1.3
    if (percentage >= 63) return 1.0
    if (percentage >= 60) return 0.7
    return 0.0
  }

  const getLetterGrade = (percentage) => {
    if (percentage === null) return '—'
    if (percentage >= 93) return 'A'
    if (percentage >= 90) return 'A-'
    if (percentage >= 87) return 'B+'
    if (percentage >= 83) return 'B'
    if (percentage >= 80) return 'B-'
    if (percentage >= 77) return 'C+'
    if (percentage >= 73) return 'C'
    if (percentage >= 70) return 'C-'
    if (percentage >= 67) return 'D+'
    if (percentage >= 63) return 'D'
    if (percentage >= 60) return 'D-'
    return 'F'
  }

  const openCreateModal = () => {
    setEditingClass(null)
    setFormData({
      name: '',
      teacher: '',
      room: '',
      color: '#6366f1',
      icon: 'book',
      credits: 3.0,
      target_grade: 90,
    })
    setShowModal(true)
  }

  const openEditModal = (cls) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      teacher: cls.teacher || '',
      room: cls.room || '',
      color: cls.color || '#6366f1',
      icon: cls.icon || 'book',
      credits: cls.credits || 3.0,
      target_grade: cls.target_grade || 90,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update(formData)
          .eq('id', editingClass.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('classes')
          .insert({
            ...formData,
            user_id: user.id,
          })

        if (error) throw error
      }

      setShowModal(false)
      loadClasses()
    } catch (error) {
      console.error('Error saving class:', error)
      alert('Failed to save class: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (classId) => {
    if (!confirm('Are you sure you want to delete this class? All grades and notes will be lost.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (error) throw error
      loadClasses()
    } catch (error) {
      console.error('Error deleting class:', error)
      alert('Failed to delete class: ' + error.message)
    }
  }

  const getIconPath = (iconName) => {
    const icon = CLASS_ICONS.find(i => i.value === iconName)
    return icon?.icon || CLASS_ICONS[0].icon
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Classes</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Class
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* GPA Summary Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-indigo-100">Current GPA</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{gpaData.gpa}</span>
                <span className="text-indigo-200">/ 4.0</span>
              </div>
              <p className="text-indigo-200 mt-1">{gpaData.totalCredits} credits</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold">{classes.length}</div>
                <div className="text-sm text-indigo-200">Classes</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold">
                  {classes.filter(c => c.current_grade >= 90).length}
                </div>
                <div className="text-sm text-indigo-200">A's</div>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No classes yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first class to start tracking grades</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Your First Class
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Color Bar */}
                <div className="h-2" style={{ backgroundColor: cls.color }}></div>

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: cls.color + '20' }}
                      >
                        <svg
                          className="w-6 h-6"
                          style={{ color: cls.color }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(cls.icon)} />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{cls.name}</h3>
                        {cls.teacher && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{cls.teacher}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Grade Display */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current Grade</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {cls.current_grade !== null ? `${cls.current_grade.toFixed(1)}%` : '—'}
                        </span>
                        <span
                          className="text-lg font-semibold"
                          style={{ color: cls.color }}
                        >
                          {getLetterGrade(cls.current_grade)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Credits</p>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">{cls.credits}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {cls.current_grade !== null && (
                    <div className="mb-4">
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(cls.current_grade, 100)}%`,
                            backgroundColor: cls.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Info Row */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {cls.room && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {cls.room}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {cls.grades?.length || 0} grades
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/classes/${cls.id}`}
                    className="block w-full py-2.5 text-center font-medium rounded-lg transition-colors"
                    style={{
                      backgroundColor: cls.color + '15',
                      color: cls.color,
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingClass ? 'Edit Class' : 'Add New Class'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., AP Calculus BC"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teacher
                    </label>
                    <input
                      type="text"
                      value={formData.teacher}
                      onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Mr. Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Room
                    </label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Room 204"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Credits
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="6"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Grade %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.target_grade}
                      onChange={(e) => setFormData({ ...formData, target_grade: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CLASS_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CLASS_ICONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: icon.value })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          formData.icon === icon.value
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={icon.name}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.icon} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
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

