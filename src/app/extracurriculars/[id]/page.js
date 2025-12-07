'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ACTIVITY_TYPES = [
  'Meeting',
  'Practice',
  'Competition',
  'Volunteering',
  'Training',
  'Event',
  'Performance',
  'Other',
]

const ACHIEVEMENT_TYPES = [
  { name: 'Award', value: 'award' },
  { name: 'Certificate', value: 'certificate' },
  { name: 'Recognition', value: 'recognition' },
  { name: 'Milestone', value: 'milestone' },
  { name: 'Promotion', value: 'promotion' },
  { name: 'Other', value: 'other' },
]

const ACHIEVEMENT_LEVELS = [
  { name: 'School', value: 'school' },
  { name: 'District', value: 'district' },
  { name: 'Regional', value: 'regional' },
  { name: 'State', value: 'state' },
  { name: 'National', value: 'national' },
  { name: 'International', value: 'international' },
]

export default function ActivityDetailPage({ params }) {
  const { id } = use(params)
  const [activityData, setActivityData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('hours')
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [editingHours, setEditingHours] = useState(null)
  const [editingAchievement, setEditingAchievement] = useState(null)
  const [hoursForm, setHoursForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    minutes: 0,
    activity_type: 'Meeting',
    description: '',
    location: '',
  })
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    achievement_type: 'award',
    date_earned: new Date().toISOString().split('T')[0],
    issuing_organization: '',
    level: '',
    is_featured: false,
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadActivityData()
  }, [id])

  const loadActivityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('extracurriculars')
        .select(`
          *,
          activity_hours (*),
          achievements (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      if (!data) {
        router.push('/extracurriculars')
        return
      }

      // Sort hours by date
      if (data.activity_hours) {
        data.activity_hours.sort((a, b) => new Date(b.date) - new Date(a.date))
      }

      // Sort achievements by date
      if (data.achievements) {
        data.achievements.sort((a, b) => new Date(b.date_earned) - new Date(a.date_earned))
      }

      setActivityData(data)
    } catch (error) {
      console.error('Error loading activity:', error)
      router.push('/extracurriculars')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalHours = () => {
    if (!activityData?.activity_hours?.length) return 0
    return activityData.activity_hours.reduce((sum, h) => {
      return sum + parseFloat(h.hours) + (h.minutes || 0) / 60
    }, 0)
  }

  const openAddHoursModal = () => {
    setEditingHours(null)
    setHoursForm({
      date: new Date().toISOString().split('T')[0],
      hours: '',
      minutes: 0,
      activity_type: 'Meeting',
      description: '',
      location: '',
    })
    setShowHoursModal(true)
  }

  const openEditHoursModal = (hour) => {
    setEditingHours(hour)
    setHoursForm({
      date: hour.date,
      hours: hour.hours,
      minutes: hour.minutes || 0,
      activity_type: hour.activity_type || 'Meeting',
      description: hour.description || '',
      location: hour.location || '',
    })
    setShowHoursModal(true)
  }

  const handleHoursSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (editingHours) {
        const { error } = await supabase
          .from('activity_hours')
          .update({
            date: hoursForm.date,
            hours: parseFloat(hoursForm.hours),
            minutes: parseInt(hoursForm.minutes),
            activity_type: hoursForm.activity_type.toLowerCase(),
            description: hoursForm.description,
            location: hoursForm.location,
          })
          .eq('id', editingHours.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('activity_hours')
          .insert({
            user_id: user.id,
            extracurricular_id: id,
            date: hoursForm.date,
            hours: parseFloat(hoursForm.hours),
            minutes: parseInt(hoursForm.minutes),
            activity_type: hoursForm.activity_type.toLowerCase(),
            description: hoursForm.description,
            location: hoursForm.location,
          })

        if (error) throw error
      }

      setShowHoursModal(false)
      loadActivityData()
    } catch (error) {
      console.error('Error saving hours:', error)
      alert('Failed to save hours: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHours = async (hourId) => {
    if (!confirm('Are you sure you want to delete this hours entry?')) return

    try {
      const { error } = await supabase
        .from('activity_hours')
        .delete()
        .eq('id', hourId)

      if (error) throw error
      loadActivityData()
    } catch (error) {
      console.error('Error deleting hours:', error)
      alert('Failed to delete hours: ' + error.message)
    }
  }

  const openAddAchievementModal = () => {
    setEditingAchievement(null)
    setAchievementForm({
      title: '',
      description: '',
      achievement_type: 'award',
      date_earned: new Date().toISOString().split('T')[0],
      issuing_organization: '',
      level: '',
      is_featured: false,
    })
    setShowAchievementModal(true)
  }

  const openEditAchievementModal = (achievement) => {
    setEditingAchievement(achievement)
    setAchievementForm({
      title: achievement.title,
      description: achievement.description || '',
      achievement_type: achievement.achievement_type || 'award',
      date_earned: achievement.date_earned,
      issuing_organization: achievement.issuing_organization || '',
      level: achievement.level || '',
      is_featured: achievement.is_featured || false,
    })
    setShowAchievementModal(true)
  }

  const handleAchievementSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (editingAchievement) {
        const { error } = await supabase
          .from('achievements')
          .update({
            title: achievementForm.title,
            description: achievementForm.description,
            achievement_type: achievementForm.achievement_type,
            date_earned: achievementForm.date_earned,
            issuing_organization: achievementForm.issuing_organization,
            level: achievementForm.level,
            is_featured: achievementForm.is_featured,
          })
          .eq('id', editingAchievement.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('achievements')
          .insert({
            user_id: user.id,
            extracurricular_id: id,
            title: achievementForm.title,
            description: achievementForm.description,
            achievement_type: achievementForm.achievement_type,
            date_earned: achievementForm.date_earned,
            issuing_organization: achievementForm.issuing_organization,
            level: achievementForm.level,
            is_featured: achievementForm.is_featured,
          })

        if (error) throw error
      }

      setShowAchievementModal(false)
      loadActivityData()
    } catch (error) {
      console.error('Error saving achievement:', error)
      alert('Failed to save achievement: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAchievement = async (achievementId) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', achievementId)

      if (error) throw error
      loadActivityData()
    } catch (error) {
      console.error('Error deleting achievement:', error)
      alert('Failed to delete achievement: ' + error.message)
    }
  }

  const getAchievementTypeLabel = (type) => {
    const t = ACHIEVEMENT_TYPES.find(a => a.value === type)
    return t?.name || 'Other'
  }

  const getLevelLabel = (level) => {
    const l = ACHIEVEMENT_LEVELS.find(a => a.value === level)
    return l?.name || level
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!activityData) return null

  const totalHours = calculateTotalHours()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link href="/extracurriculars" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: activityData.color + '20' }}
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: activityData.color }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{activityData.name}</h1>
                  {activityData.is_leadership && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      🏆 Leadership
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {activityData.role && <span>{activityData.role}</span>}
                  {activityData.organization && <span>• {activityData.organization}</span>}
                  <span className="capitalize">• {activityData.category}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
              <div className="flex items-baseline gap-2 justify-end">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {totalHours.toFixed(1)}
                </span>
                <span
                  className="text-lg font-medium"
                  style={{ color: activityData.color }}
                >
                  hrs
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {activityData.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">{activityData.description}</p>
          )}

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {['hours', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium capitalize rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
                {tab === 'hours' && activityData.activity_hours?.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                    {activityData.activity_hours.length}
                  </span>
                )}
                {tab === 'achievements' && activityData.achievements?.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                    {activityData.achievements.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hours Log</h2>
              <button
                onClick={openAddHoursModal}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Log Hours
              </button>
            </div>

            {/* Hours Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours.toFixed(1)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activityData.activity_hours?.filter(h => {
                    const date = new Date(h.date)
                    const now = new Date()
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  }).reduce((sum, h) => sum + parseFloat(h.hours) + (h.minutes || 0) / 60, 0).toFixed(1) || '0'}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Entries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activityData.activity_hours?.length || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg per Entry</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activityData.activity_hours?.length > 0 ? (totalHours / activityData.activity_hours.length).toFixed(1) : '0'}
                </p>
              </div>
            </div>

            {activityData.activity_hours?.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No hours logged yet</p>
                <button
                  onClick={openAddHoursModal}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Log your first hours
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activityData.activity_hours.map((hour) => (
                      <tr key={hour.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(hour.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {hour.hours}h {hour.minutes > 0 && `${hour.minutes}m`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
                            {hour.activity_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-500 dark:text-gray-400 truncate max-w-xs block">
                            {hour.description || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openEditHoursModal(hour)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteHours(hour.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Achievements & Awards</h2>
              <button
                onClick={openAddAchievementModal}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Achievement
              </button>
            </div>

            {activityData.achievements?.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No achievements yet</p>
                <button
                  onClick={openAddAchievementModal}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Add your first achievement
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activityData.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 ${
                      achievement.is_featured 
                        ? 'border-amber-300 dark:border-amber-600 ring-2 ring-amber-100 dark:ring-amber-900/30' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🏆</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{achievement.title}</h3>
                          {achievement.is_featured && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">⭐ Featured</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditAchievementModal(achievement)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAchievement(achievement.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {achievement.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {achievement.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 capitalize">
                        {getAchievementTypeLabel(achievement.achievement_type)}
                      </span>
                      {achievement.level && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 capitalize">
                          {getLevelLabel(achievement.level)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{new Date(achievement.date_earned).toLocaleDateString()}</span>
                      {achievement.issuing_organization && (
                        <span className="truncate ml-2">{achievement.issuing_organization}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hours Modal */}
      {showHoursModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingHours ? 'Edit Hours' : 'Log Hours'}
                </h2>
                <button
                  onClick={() => setShowHoursModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleHoursSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={hoursForm.date}
                    onChange={(e) => setHoursForm({ ...hoursForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hours *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.5"
                      min="0"
                      max="24"
                      value={hoursForm.hours}
                      onChange={(e) => setHoursForm({ ...hoursForm, hours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minutes
                    </label>
                    <select
                      value={hoursForm.minutes}
                      onChange={(e) => setHoursForm({ ...hoursForm, minutes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={0}>0 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={hoursForm.activity_type}
                    onChange={(e) => setHoursForm({ ...hoursForm, activity_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {ACTIVITY_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={hoursForm.description}
                    onChange={(e) => setHoursForm({ ...hoursForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="What did you do?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={hoursForm.location}
                    onChange={(e) => setHoursForm({ ...hoursForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Where?"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHoursModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingHours ? 'Save Changes' : 'Log Hours'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Modal */}
      {showAchievementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingAchievement ? 'Edit Achievement' : 'Add Achievement'}
                </h2>
                <button
                  onClick={() => setShowAchievementModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAchievementSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={achievementForm.title}
                    onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 1st Place Regional Competition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={achievementForm.achievement_type}
                      onChange={(e) => setAchievementForm({ ...achievementForm, achievement_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {ACHIEVEMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Level
                    </label>
                    <select
                      value={achievementForm.level}
                      onChange={(e) => setAchievementForm({ ...achievementForm, level: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select level</option>
                      {ACHIEVEMENT_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>{level.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Earned
                  </label>
                  <input
                    type="date"
                    value={achievementForm.date_earned}
                    onChange={(e) => setAchievementForm({ ...achievementForm, date_earned: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    value={achievementForm.issuing_organization}
                    onChange={(e) => setAchievementForm({ ...achievementForm, issuing_organization: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Who issued this award?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={achievementForm.description}
                    onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Describe your achievement..."
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={achievementForm.is_featured}
                    onChange={(e) => setAchievementForm({ ...achievementForm, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">⭐ Feature this achievement</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAchievementModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingAchievement ? 'Save Changes' : 'Add Achievement'}
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

