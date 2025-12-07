'use client'

<<<<<<< Updated upstream
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, differenceInDays, addDays } from "date-fns";
import WorkloadBalanceWidget from "@/components/WorkloadBalanceWidget";
import "./calendar.css";

// Sample initial events - in a real app, these would come from a database
const initialEvents = [
  {
    id: "1",
    title: "Math Test",
    start: addDays(new Date(), 3).toISOString().split("T")[0],
    type: "test",
    reminderDays: 2,
    className: "event-test",
  },
  {
    id: "2",
    title: "Physics Assignment",
    start: addDays(new Date(), 1).toISOString().split("T")[0],
    type: "assignment",
    className: "event-assignment",
  },
  {
    id: "3",
    title: "History Essay Due",
    start: addDays(new Date(), 5).toISOString().split("T")[0],
    type: "assignment",
    className: "event-assignment",
  },
  {
    id: "4",
    title: "Chemistry Quiz",
    start: addDays(new Date(), 7).toISOString().split("T")[0],
    type: "test",
    reminderDays: 3,
    className: "event-test",
  },
];

export default function CalendarPage() {
  const [events, setEvents] = useState(initialEvents);
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const calendarRef = useRef(null);
  const router = useRouter();
  const supabase = createClient();

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "assignment",
    reminderDays: 1,
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setAuthLoading(false);
    };
    checkAuth();
  }, [router, supabase.auth]);

  // Generate reminders based on upcoming events
  const generateReminders = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newReminders = [];

    events.forEach((event) => {
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      const daysUntil = differenceInDays(eventDate, today);

      // Test reminder (configurable days before)
      if (event.type === "test") {
        if (daysUntil > 0 && daysUntil <= (event.reminderDays || 2)) {
          newReminders.push({
            id: `reminder-${event.id}`,
            title: `📚 Study reminder: ${event.title}`,
            message: `${daysUntil} day${daysUntil > 1 ? "s" : ""} until your test!`,
            type: "reminder",
            urgent: daysUntil <= 1,
          });
        }

        // Last-minute cram reminder (day before or same day)
        if (daysUntil === 1) {
          newReminders.push({
            id: `cram-${event.id}`,
            title: `🚨 Last-minute cram: ${event.title}`,
            message: "Tomorrow is your test! Time for final review!",
            type: "cram",
            urgent: true,
          });
        } else if (daysUntil === 0) {
          newReminders.push({
            id: `today-${event.id}`,
            title: `📝 Today: ${event.title}`,
            message: "Your test is TODAY! Good luck!",
            type: "today",
            urgent: true,
          });
        }
      }

      // Assignment due soon reminder
      if (event.type === "assignment" && daysUntil >= 0 && daysUntil <= 2) {
        newReminders.push({
          id: `due-${event.id}`,
          title: `📋 Due soon: ${event.title}`,
          message:
            daysUntil === 0
              ? "Due today!"
              : `Due in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
          type: daysUntil === 0 ? "today" : "reminder",
          urgent: daysUntil <= 1,
        });
      }
    });

    setReminders(newReminders);
  }, [events]);
=======
import { useState, useEffect } from 'react'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', type: 'assignment' })
>>>>>>> Stashed changes

  useEffect(() => {
    // Load events from localStorage or fetch from API
    const saved = localStorage.getItem('studytide-calendar-events')
    if (saved) {
      setEvents(JSON.parse(saved))
    } else {
      // Fetch assignments from API
      fetchAssignments()
    }
  }, [])

  async function fetchAssignments() {
    try {
      const res = await fetch('/api/assignments')
      const data = await res.json()
      if (Array.isArray(data)) {
        const assignmentEvents = data.map(a => ({
          id: `assignment-${a.id}`,
          title: a.title,
          date: a.dueDate,
          type: 'assignment',
          completed: a.completed
        }))
        setEvents(assignmentEvents)
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
      <div className="calendar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'white', fontSize: '1rem' }}>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <main className="max-w-4xl mx-auto p-6 pt-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">📅 Calendar</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">View and manage your schedule</p>

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
    </div>
  )
}
