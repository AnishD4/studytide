'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ACTIVITY_COLORS = [
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

const ACTIVITY_ICONS = [
  { name: 'Star', value: 'star', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Trophy', value: 'trophy', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { name: 'Users', value: 'users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'Music', value: 'music', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
  { name: 'Heart', value: 'heart', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { name: 'Lightning', value: 'lightning', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { name: 'Flag', value: 'flag', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' },
  { name: 'Globe', value: 'globe', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const ACTIVITY_CATEGORIES = [
  { name: 'Club', value: 'club' },
  { name: 'Sports', value: 'sports' },
  { name: 'Volunteering', value: 'volunteering' },
  { name: 'Arts', value: 'arts' },
  { name: 'Music', value: 'music' },
  { name: 'Academic', value: 'academic' },
  { name: 'Work', value: 'work' },
  { name: 'Other', value: 'other' },
]

export default function ExtracurricularsPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'club',
    description: '',
    organization: '',
    role: '',
    color: '#6366f1',
    icon: 'star',
    is_leadership: false,
    is_active: true,
    start_date: '',
    meeting_schedule: '',
  })
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ totalHours: 0, totalActivities: 0, achievements: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load activities with hours and achievements count
      const { data, error } = await supabase
        .from('extracurriculars')
        .select(`
          *,
          activity_hours (id, hours, minutes),
          achievements (id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setActivities(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    let totalHours = 0
    let totalAchievements = 0

    data.forEach(activity => {
      if (activity.activity_hours) {
        activity.activity_hours.forEach(h => {
          totalHours += parseFloat(h.hours) + (h.minutes || 0) / 60
        })
      }
      if (activity.achievements) {
        totalAchievements += activity.achievements.length
      }
    })

    setStats({
      totalHours: totalHours.toFixed(1),
      totalActivities: data.length,
      achievements: totalAchievements,
    })
  }

  const getTotalHours = (activity) => {
    if (!activity.activity_hours?.length) return 0
    return activity.activity_hours.reduce((sum, h) => {
      return sum + parseFloat(h.hours) + (h.minutes || 0) / 60
    }, 0)
  }

  const openCreateModal = () => {
    setEditingActivity(null)
    setFormData({
      name: '',
      category: 'club',
      description: '',
      organization: '',
      role: '',
      color: '#6366f1',
      icon: 'star',
      is_leadership: false,
      is_active: true,
      start_date: '',
      meeting_schedule: '',
    })
    setShowModal(true)
  }

  const openEditModal = (activity) => {
    setEditingActivity(activity)
    setFormData({
      name: activity.name,
      category: activity.category || 'club',
      description: activity.description || '',
      organization: activity.organization || '',
      role: activity.role || '',
      color: activity.color || '#6366f1',
      icon: activity.icon || 'star',
      is_leadership: activity.is_leadership || false,
      is_active: activity.is_active ?? true,
      start_date: activity.start_date || '',
      meeting_schedule: activity.meeting_schedule || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (editingActivity) {
        const { error } = await supabase
          .from('extracurriculars')
          .update(formData)
          .eq('id', editingActivity.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('extracurriculars')
          .insert({
            ...formData,
            user_id: user.id,
          })

        if (error) throw error
      }

      setShowModal(false)
      loadActivities()
    } catch (error) {
      console.error('Error saving activity:', error)
      alert('Failed to save activity: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (activityId) => {
    if (!confirm('Are you sure you want to delete this activity? All hours and achievements will be lost.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('extracurriculars')
        .delete()
        .eq('id', activityId)

      if (error) throw error
      loadActivities()
    } catch (error) {
      console.error('Error deleting activity:', error)
      alert('Failed to delete activity: ' + error.message)
    }
  }

  const getIconPath = (iconName) => {
    const icon = ACTIVITY_ICONS.find(i => i.value === iconName)
    return icon?.icon || ACTIVITY_ICONS[0].icon
  }

  const getCategoryLabel = (category) => {
    const cat = ACTIVITY_CATEGORIES.find(c => c.value === category)
    return cat?.name || 'Other'
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Extracurriculars</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Activity
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Summary Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-emerald-100">Total Hours Logged</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{stats.totalHours}</span>
                <span className="text-emerald-200">hours</span>
              </div>
              <p className="text-emerald-200 mt-1">Across {stats.totalActivities} activities</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold">{stats.totalActivities}</div>
                <div className="text-sm text-emerald-200">Activities</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold">{stats.achievements}</div>
                <div className="text-sm text-emerald-200">Achievements</div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Grid */}
        {activities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first extracurricular activity to start tracking hours</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Your First Activity
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => {
              const totalHours = getTotalHours(activity)
              return (
                <div
                  key={activity.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Color Bar */}
                  <div className="h-2" style={{ backgroundColor: activity.color }}></div>

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: activity.color + '20' }}
                        >
                          <svg
                            className="w-6 h-6"
                            style={{ color: activity.color }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(activity.icon)} />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{activity.name}</h3>
                          {activity.role && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{activity.role}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(activity)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Category & Leadership Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
                        {getCategoryLabel(activity.category)}
                      </span>
                      {activity.is_leadership && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          🏆 Leadership
                        </span>
                      )}
                      {!activity.is_active && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Hours Display */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {totalHours.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">hrs</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Achievements</p>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">
                          {activity.achievements?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {totalHours > 0 && (
                      <div className="mb-4">
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min((totalHours / 100) * 100, 100)}%`,
                              backgroundColor: activity.color,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Progress to 100 hours</p>
                      </div>
                    )}

                    {/* Info Row */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {activity.organization && (
                        <span className="flex items-center gap-1 truncate">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate">{activity.organization}</span>
                        </span>
                      )}
                      {activity.meeting_schedule && (
                        <span className="flex items-center gap-1 truncate">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="truncate">{activity.meeting_schedule}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/extracurriculars/${activity.id}`}
                      className="block w-full py-2.5 text-center font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: activity.color + '15',
                        color: activity.color,
                      }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              )
            })}
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
                  {editingActivity ? 'Edit Activity' : 'Add New Activity'}
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
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Robotics Club"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {ACTIVITY_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Role
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="President, Member..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="School name, organization..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Meeting Schedule
                    </label>
                    <input
                      type="text"
                      value={formData.meeting_schedule}
                      onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Tuesdays 3-5pm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Brief description of the activity..."
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_leadership}
                      onChange={(e) => setFormData({ ...formData, is_leadership: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Leadership Position</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Currently Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_COLORS.map((color) => (
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
                    {ACTIVITY_ICONS.map((icon) => (
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
                    {saving ? 'Saving...' : editingActivity ? 'Save Changes' : 'Create Activity'}
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

