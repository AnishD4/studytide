'use client'

import { useState } from 'react'
import VantaWavesBackground from '@/components/VantaWavesBackground'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Study Preferences
    studyHoursPerDay: 4,
    preferredStudyTime: 'morning',
    studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    breakDuration: 10,
    studySessionLength: 25,

    // Notifications
    notificationsEnabled: true,
    deadlineReminders: true,
    dailyStudyReminder: true,
    weeklyGoalReminder: true,
    reminderTime: '09:00',

    // AI Preferences
    aiDifficulty: 'medium',
    flashcardCount: 10,
    testQuestionCount: 10,

    // Display Preferences
    darkMode: false,
    compactView: false,
    showCompletedTasks: true,

    // Goals & Motivation
    weeklyStudyGoal: 20,
    motivationalQuotes: true,
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('study') // 'study', 'notifications', 'ai', 'display', 'account'

  const DAYS = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' },
  ]

  function handleSave() {
    localStorage.setItem('studytide-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleDay(dayId) {
    setSettings(prev => ({
      ...prev,
      studyDays: prev.studyDays.includes(dayId)
        ? prev.studyDays.filter(d => d !== dayId)
        : [...prev.studyDays, dayId]
    }))
  }

  return (
    <VantaWavesBackground className="min-h-screen" darkOverlay={true}>
      <main className="max-w-4xl mx-auto p-6 pt-8">
        <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">⚙️ Settings</h1>
        <p className="text-gray-100 mb-8 drop-shadow-md">Customize your StudyTide experience</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('study')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'study'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            📚 Study
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🔔 Notifications
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'ai'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🤖 AI Preferences
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'display'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🎨 Display
          </button>
        </div>

        <div className="space-y-6">
          {/* Study Tab */}
          {activeTab === 'study' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Daily Goals</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Daily study hours goal
                    </label>
                    <select
                      value={settings.studyHoursPerDay}
                      onChange={e => setSettings(prev => ({ ...prev, studyHoursPerDay: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    >
                      {[1,2,3,4,5,6,8].map(h => <option key={h} value={h}>{h} hour{h>1?'s':''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Weekly study goal (hours)
                    </label>
                    <input
                      type="number"
                      value={settings.weeklyStudyGoal}
                      onChange={e => setSettings(prev => ({ ...prev, weeklyStudyGoal: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                      min="1"
                      max="70"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Study Schedule</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Preferred study time
                    </label>
                    <select
                      value={settings.preferredStudyTime}
                      onChange={e => setSettings(prev => ({ ...prev, preferredStudyTime: e.target.value }))}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="morning">Morning (6am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 6pm)</option>
                      <option value="evening">Evening (6pm - 10pm)</option>
                      <option value="night">Night (10pm - 2am)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Study days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <button
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            settings.studyDays.includes(day.id)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pomodoro Timer</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Study session length (minutes)
                    </label>
                    <select
                      value={settings.studySessionLength}
                      onChange={e => setSettings(prev => ({ ...prev, studySessionLength: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={25}>25 minutes (Pomodoro)</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Break duration (minutes)
                    </label>
                    <select
                      value={settings.breakDuration}
                      onChange={e => setSettings(prev => ({ ...prev, breakDuration: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Reminder Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Enable notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Master toggle for all notifications</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={e => setSettings(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Deadline reminders</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Get notified before assignments are due</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.deadlineReminders}
                    onChange={e => setSettings(prev => ({ ...prev, deadlineReminders: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Daily study reminder</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Remind me to study each day</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dailyStudyReminder}
                    onChange={e => setSettings(prev => ({ ...prev, dailyStudyReminder: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Weekly goal reminder</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Check-in on weekly study goals</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.weeklyGoalReminder}
                    onChange={e => setSettings(prev => ({ ...prev, weeklyGoalReminder: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Daily reminder time
                  </label>
                  <input
                    type="time"
                    value={settings.reminderTime}
                    onChange={e => setSettings(prev => ({ ...prev, reminderTime: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">AI Generation Preferences</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    AI difficulty level
                  </label>
                  <select
                    value={settings.aiDifficulty}
                    onChange={e => setSettings(prev => ({ ...prev, aiDifficulty: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="easy">Easy - Beginner-friendly questions</option>
                    <option value="medium">Medium - Balanced difficulty</option>
                    <option value="hard">Hard - Challenging questions</option>
                    <option value="mixed">Mixed - Variety of difficulties</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Default flashcard count
                  </label>
                  <input
                    type="number"
                    value={settings.flashcardCount}
                    onChange={e => setSettings(prev => ({ ...prev, flashcardCount: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    min="5"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Default test question count
                  </label>
                  <input
                    type="number"
                    value={settings.testQuestionCount}
                    onChange={e => setSettings(prev => ({ ...prev, testQuestionCount: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    min="5"
                    max="50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Display Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Compact view</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Use denser layout for lists</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactView}
                    onChange={e => setSettings(prev => ({ ...prev, compactView: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Show completed tasks</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Display finished assignments in lists</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showCompletedTasks}
                    onChange={e => setSettings(prev => ({ ...prev, showCompletedTasks: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Motivational quotes</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Show inspirational messages</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.motivationalQuotes}
                    onChange={e => setSettings(prev => ({ ...prev, motivationalQuotes: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </main>
    </VantaWavesBackground>
  )
}
