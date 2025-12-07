'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WorkloadBalanceWidget() {
  const [loading, setLoading] = useState(true)
  const [workloadData, setWorkloadData] = useState(null)
  const [procrastinationRisks, setProcrastinationRisks] = useState([])
  const [expanded, setExpanded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [workloadRes, risksRes] = await Promise.all([
        fetch('/api/workload-balance'),
        fetch('/api/procrastination-check'),
      ])

      if (workloadRes.ok) {
        const data = await workloadRes.json()
        setWorkloadData(data)
      }

      if (risksRes.ok) {
        const risks = await risksRes.json()
        setProcrastinationRisks(Array.isArray(risks) ? risks : [])
      }
    } catch (error) {
      console.error('Error loading workload data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBalanceColor = (score) => {
    if (score >= 70) return 'text-emerald-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const getBalanceBg = (score) => {
    if (score >= 70) return 'bg-emerald-100 dark:bg-emerald-900/30'
    if (score >= 40) return 'bg-amber-100 dark:bg-amber-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-amber-400 text-gray-900'
      default: return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getRiskIcon = (level) => {
    switch (level) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '📢'
      default: return '✓'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const highRisks = procrastinationRisks.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high')

  return (
    <div className="space-y-4">
      {/* Workload Balance Score */}
      {workloadData && (
        <div className={`rounded-xl p-4 border ${getBalanceBg(workloadData.summary.balanceScore)} border-gray-200 dark:border-gray-700`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              ⚖️ Workload Balance
            </h3>
            <span className={`text-2xl font-bold ${getBalanceColor(workloadData.summary.balanceScore)}`}>
              {workloadData.summary.balanceScore}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                workloadData.summary.balanceScore >= 70
                  ? 'bg-emerald-500'
                  : workloadData.summary.balanceScore >= 40
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${workloadData.summary.balanceScore}%` }}
            />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {workloadData.summary.recommendation}
          </p>

          {workloadData.summary.overloadedDays > 0 && (
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              ⚠️ {workloadData.summary.overloadedDays} overloaded day{workloadData.summary.overloadedDays > 1 ? 's' : ''} detected
            </div>
          )}

          {/* Suggestions */}
          {workloadData.suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
              >
                {expanded ? '▼' : '▶'} View {workloadData.suggestions.length} suggestion{workloadData.suggestions.length > 1 ? 's' : ''}
              </button>

              {expanded && (
                <div className="mt-2 space-y-2">
                  {workloadData.suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-sm ${
                        suggestion.severity === 'high'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {suggestion.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Procrastination Risks */}
      {highRisks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            🚨 Procrastination Alerts
          </h3>

          <div className="space-y-2">
            {highRisks.slice(0, 3).map((risk) => (
              <div
                key={risk.assignment.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(risk.riskLevel)}`}>
                      {getRiskIcon(risk.riskLevel)} {risk.riskLevel}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate mt-1">
                    {risk.assignment.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {risk.assignment.classes?.name} • Due in {risk.daysUntilDue} day{risk.daysUntilDue !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  <div>{risk.totalStudyMinutes}min</div>
                  <div>studied</div>
                </div>
              </div>
            ))}
          </div>

          {highRisks.length > 3 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              +{highRisks.length - 3} more at risk
            </p>
          )}
        </div>
      )}

      {/* All Clear State */}
      {workloadData && workloadData.summary.balanceScore >= 70 && highRisks.length === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-emerald-700 dark:text-emerald-300 font-medium">You're on track!</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Keep up the great work!</p>
        </div>
      )}
    </div>
  )
}

