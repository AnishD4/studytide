'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VantaWavesBackground from '@/components/VantaWavesBackground'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', type: 'assignment' })
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setAuthLoading(false)
    }
    checkAuth()
  }, [router, supabase.auth])

  useEffect(() => {
    if (!authLoading && user) {
      fetchAssignments()
    }
  }, [authLoading, user])

  async function fetchAssignments() {
    try {
      const res = await fetch('/api/assignments')
      const data = await res.json()

      if (Array.isArray(data)) {
        // Merge saved manual events with assignments
        const saved = localStorage.getItem('studytide-calendar-events')
        const manualEvents = saved ? JSON.parse(saved) : []

        const assignmentEvents = data.map(a => ({
          id: `assignment-${a.id}`,
          title: a.completed ? `✅ ${a.title}` : a.title,
          date: a.dueDate,
          type: 'assignment',
          completed: a.completed,
          className: a.className,
          classColor: a.classColor
        }))

        // Combine with manual events
        const allEvents = [...manualEvents, ...assignmentEvents]
        setEvents(allEvents)
      }
    } catch (err) {
      console.error('Error fetching assignments:', err)
    }
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay()
  }

  function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function getEventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr)
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  function handleDateClick(day) {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(dateStr)
    setShowModal(true)
  }

  function handleAddEvent(e) {
    e.preventDefault()
    if (!newEvent.title.trim() || !selectedDate) return

    const event = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: selectedDate,
      type: newEvent.type
    }

    const updatedEvents = [...events, event]
    setEvents(updatedEvents)
    localStorage.setItem('studytide-calendar-events', JSON.stringify(updatedEvents))
    setNewEvent({ title: '', type: 'assignment' })
    setShowModal(false)
  }

  function handleDeleteEvent(eventId) {
    const updatedEvents = events.filter(e => e.id !== eventId)
    setEvents(updatedEvents)
    localStorage.setItem('studytide-calendar-events', JSON.stringify(updatedEvents))
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const today = new Date()
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <VantaWavesBackground className="min-h-[calc(100vh-60px)] flex items-center justify-center" darkOverlay={true}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-3 border-cyan-200 border-t-cyan-400 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-100">Loading calendar...</p>
        </div>
      </VantaWavesBackground>
    )
  }

  return (
    <VantaWavesBackground className="min-h-[calc(100vh-60px)]" darkOverlay={true}>
      <main className="max-w-4xl mx-auto p-6 pt-8">
        <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">📅 Calendar</h1>
        <p className="text-gray-100 mb-8 drop-shadow-md">View and manage your schedule</p>

        {/* Calendar Header */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{monthName} {year}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-[80px] border-b border-r border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50"></div>
              }

              const dateStr = formatDate(year, month, day)
              const dayEvents = getEventsForDate(dateStr)
              const isToday = dateStr === todayStr

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[80px] p-2 border-b border-r border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate ${
                          event.type === 'test' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                            : event.completed
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 line-through'
                              : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-100 dark:bg-indigo-900/30"></div>
            <span>Assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30"></div>
            <span>Test</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30"></div>
            <span>Completed</span>
          </div>
        </div>
      </main>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Add Event - {selectedDate}
            </h3>

            {/* Existing events for this date */}
            {getEventsForDate(selectedDate).length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Events on this day:</p>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{event.title}</span>
                      {!event.id.startsWith('assignment-') && (
                        <button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 hover:text-red-600 text-sm">Delete</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAddEvent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Event title</label>
                  <input
                    value={newEvent.title}
                    onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="test">Test/Exam</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </VantaWavesBackground>
  )
}

