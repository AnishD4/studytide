'use client'

import { useState, useEffect } from 'react'
import EmailComposer from './EmailComposer'

export default function DashboardWidgets() {
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [procrastinationRisks, setProcrastinationRisks] = useState([])

  useEffect(() => {
    loadProcrastinationRisks()
  }, [])

  const loadProcrastinationRisks = async () => {
    try {
      const res = await fetch('/api/procrastination-check')
      if (res.ok) {
        const risks = await res.json()
        setProcrastinationRisks(Array.isArray(risks) ? risks.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high') : [])
      }
    } catch (error) {
      console.error('Error loading procrastination risks:', error)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-700'
    }
  }

  return (
    <>
      {/* Procrastination Alerts */}
      {procrastinationRisks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-red-200 dark:border-red-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              🚨 Procrastination Alerts
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {procrastinationRisks.length} at-risk item{procrastinationRisks.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {procrastinationRisks.slice(0, 3).map((risk) => (
              <div
                key={risk.assignment.id}
                className={`p-4 rounded-lg border-l-4 ${getRiskColor(risk.riskLevel)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        risk.riskLevel === 'critical' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-orange-500 text-white'
                      }`}>
                        {risk.riskLevel === 'critical' ? '🚨 CRITICAL' : '⚠️ HIGH RISK'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Due in {risk.daysUntilDue} day{risk.daysUntilDue !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {risk.assignment.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {risk.assignment.classes?.name} • Only {risk.totalStudyMinutes} min studied
                    </p>
                  </div>
                  <a
                    href={`/classes/${risk.assignment.class_id}`}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Study Now
                  </a>
                </div>
              </div>
            ))}
          </div>

          {procrastinationRisks.length > 3 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
              +{procrastinationRisks.length - 3} more items need attention
            </p>
          )}
        </div>
      )}

      {/* Quick Tools */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🛠️ Quick Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowEmailComposer(true)}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-colors border border-blue-200 dark:border-blue-800"
          >
            <span className="text-3xl mb-2">✉️</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Teacher</span>
          </button>

          <a
            href="/calendar"
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30 transition-colors border border-violet-200 dark:border-violet-800"
          >
            <span className="text-3xl mb-2">⚖️</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Workload Balance</span>
          </a>

          <a
            href="/progress"
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/30 dark:hover:to-yellow-900/30 transition-colors border border-amber-200 dark:border-amber-800"
          >
            <span className="text-3xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Log Study</span>
          </a>

          <a
            href="/reflections"
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-900/30 dark:hover:to-pink-900/30 transition-colors border border-rose-200 dark:border-rose-800"
          >
            <span className="text-3xl mb-2">📝</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Reflection</span>
          </a>
        </div>
      </div>

      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
      />
    </>
  )
}

