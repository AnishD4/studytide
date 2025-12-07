"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const calendarRef = useRef(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "assignment",
    reminderDays: 1,
  });

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

  useEffect(() => {
    generateReminders();
  }, [generateReminders]);

  // Handle date click to add new event
  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setNewEvent({ title: "", type: "assignment", reminderDays: 1 });
    setShowModal(true);
  };

  // Handle event click to view/edit
  const handleEventClick = (arg) => {
    const event = events.find((e) => e.id === arg.event.id);
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Handle drag and drop rescheduling
  const handleEventDrop = (arg) => {
    const updatedEvents = events.map((event) => {
      if (event.id === arg.event.id) {
        return {
          ...event,
          start: arg.event.startStr,
        };
      }
      return event;
    });
    setEvents(updatedEvents);
  };

  // Add new event
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const event = {
      id: Date.now().toString(),
      title: newEvent.title,
      start: selectedDate,
      type: newEvent.type,
      reminderDays: newEvent.type === "test" ? newEvent.reminderDays : undefined,
      className: `event-${newEvent.type}`,
    };

    setEvents([...events, event]);
    setShowModal(false);
    setNewEvent({ title: "", type: "assignment", reminderDays: 1 });
  };

  // Delete event
  const handleDeleteEvent = () => {
    setEvents(events.filter((e) => e.id !== selectedEvent.id));
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  // Dismiss reminder
  const dismissReminder = (reminderId) => {
    setReminders(reminders.filter((r) => r.id !== reminderId));
  };

  // Change calendar view
  const changeView = (view) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
      setCurrentView(view);
    }
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <header className="calendar-header">
        <h1>🌊 StudyTide Calendar</h1>
        <div className="view-toggle">
          <button
            className={currentView === "dayGridMonth" ? "active" : ""}
            onClick={() => changeView("dayGridMonth")}
          >
            📅 Month
          </button>
          <button
            className={currentView === "timeGridWeek" ? "active" : ""}
            onClick={() => changeView("timeGridWeek")}
          >
            📆 Week
          </button>
        </div>
      </header>

      <div className="calendar-layout">
        {/* Reminders Sidebar */}
        <aside className="reminders-sidebar">
          <h2>🔔 Reminders</h2>
          {reminders.length === 0 ? (
            <p className="no-reminders">All caught up! No upcoming reminders.</p>
          ) : (
            <div className="reminders-list">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`reminder-card ${reminder.urgent ? "urgent" : ""} ${reminder.type}`}
                >
                  <div className="reminder-content">
                    <h3>{reminder.title}</h3>
                    <p>{reminder.message}</p>
                  </div>
                  <button
                    className="dismiss-btn"
                    onClick={() => dismissReminder(reminder.id)}
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="calendar-legend">
            <h3>Event Types</h3>
            <div className="legend-item">
              <span className="legend-color test"></span>
              <span>📝 Tests & Quizzes</span>
            </div>
            <div className="legend-item">
              <span className="legend-color assignment"></span>
              <span>📋 Assignments</span>
            </div>
          </div>

          {/* Workload Balance */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 px-1">📊 Smart Analysis</h3>
            <WorkloadBalanceWidget />
          </div>
        </aside>

        {/* Main Calendar */}
        <main className="calendar-main">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            events={events}
            editable={true}
            droppable={true}
            selectable={true}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventClassNames={(arg) => {
              const event = events.find((e) => e.id === arg.event.id);
              return event ? [event.className] : [];
            }}
            height="auto"
            dayMaxEvents={3}
          />
        </main>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>✨ Add New Event</h2>
            <p className="modal-date">
              {selectedDate && format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
            </p>
            <form onSubmit={handleAddEvent}>
              <div className="form-group">
                <label htmlFor="title">Event Title</label>
                <input
                  type="text"
                  id="title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder="What do you need to remember?"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Event Type</label>
                <select
                  id="type"
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value })
                  }
                >
                  <option value="assignment">📋 Assignment</option>
                  <option value="test">📝 Test / Quiz</option>
                </select>
              </div>

              {newEvent.type === "test" && (
                <div className="form-group">
                  <label htmlFor="reminderDays">🔔 Remind me</label>
                  <select
                    id="reminderDays"
                    value={newEvent.reminderDays}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        reminderDays: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value={1}>1 day before</option>
                    <option value={2}>2 days before</option>
                    <option value={3}>3 days before</option>
                    <option value={5}>5 days before</option>
                    <option value={7}>1 week before</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-add">
                  ✓ Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>📌 Event Details</h2>
            <div className="event-details">
              <p className="event-title">
                {selectedEvent.type === "test" ? "📝" : "📋"}{" "}
                {selectedEvent.title}
              </p>
              <p className="event-date">
                🗓️{" "}
                {format(new Date(selectedEvent.start), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="event-type">
                🏷️ {selectedEvent.type === "test" ? "Test / Quiz" : "Assignment"}
              </p>
              {selectedEvent.type === "test" && selectedEvent.reminderDays && (
                <p className="event-reminder">
                  🔔 Reminder: {selectedEvent.reminderDays} day(s) before
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-delete"
                onClick={handleDeleteEvent}
              >
                🗑️ Delete
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowEventModal(false)}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

