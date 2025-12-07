"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, differenceInDays, addDays } from "date-fns";
import WorkloadBalanceWidget from "@/components/WorkloadBalanceWidget";
import VantaWavesBackground from "@/components/VantaWavesBackground";
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

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setShowModal(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setShowEventModal(true);
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const event = {
      id: Date.now().toString(),
      title: newEvent.title,
      start: selectedDate,
      type: newEvent.type,
      reminderDays: newEvent.reminderDays,
      className: `event-${newEvent.type}`,
    };

    setEvents([...events, event]);
    setNewEvent({ title: "", type: "assignment", reminderDays: 1 });
    setShowModal(false);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  };

  const dismissReminder = (reminderId) => {
    setReminders(reminders.filter((r) => r.id !== reminderId));
  };

  const changeView = (view) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
      setCurrentView(view);
    }
  };

  return (
    <VantaWavesBackground className="min-h-screen">
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

            <div className="calendar-legend">
              <h3>Event Types</h3>
              <div className="legend-item">
                <div className="legend-color test"></div>
                <span>Tests & Exams</span>
              </div>
              <div className="legend-item">
                <div className="legend-color assignment"></div>
                <span>Assignments</span>
              </div>
            </div>

            {/* Workload Balance Widget */}
            <div className="mt-6">
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
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              editable={true}
              selectable={true}
              height="auto"
            />
          </main>
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Event - {selectedDate}</h2>
            <form onSubmit={handleAddEvent}>
              <div className="form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value })
                  }
                >
                  <option value="assignment">Assignment</option>
                  <option value="test">Test/Exam</option>
                </select>
              </div>

              {newEvent.type === "test" && (
                <div className="form-group">
                  <label>Reminder Days Before</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={newEvent.reminderDays}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        reminderDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  ✓ Add Event
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  ✕ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedEvent.title}</h2>
            <div className="event-details">
              <p>
                <strong>Date:</strong> {selectedEvent.startStr}
              </p>
              <p>
                <strong>Type:</strong>{" "}
                {selectedEvent.extendedProps.type || "assignment"}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleDeleteEvent}>
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
    </VantaWavesBackground>
  );
}

