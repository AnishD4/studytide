import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Smart workload balancing algorithm
function analyzeWorkload(assignments, studySessions, settings = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const maxHoursPerDay = settings.maxStudyHoursPerDay || 4
  const preferredStudyDays = settings.preferredStudyDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

  // Group assignments by due date
  const assignmentsByDate = {}
  const upcomingAssignments = assignments
    .filter(a => {
      const dueDate = new Date(a.due_date)
      return dueDate >= today && !a.is_completed
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))

  upcomingAssignments.forEach(assignment => {
    const dateKey = assignment.due_date
    if (!assignmentsByDate[dateKey]) {
      assignmentsByDate[dateKey] = []
    }
    assignmentsByDate[dateKey].push(assignment)
  })

  // Calculate workload score for each day (next 14 days)
  const workloadByDay = []
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    const dueAssignments = assignmentsByDate[dateStr] || []
    const isPreferredDay = preferredStudyDays.includes(dayName)

    // Calculate estimated hours needed for assignments due on this day
    const estimatedHours = dueAssignments.reduce((sum, a) => {
      const weight = a.weight || 1
      const difficulty = a.difficulty || 'medium'
      const difficultyMultiplier = { easy: 0.5, medium: 1, hard: 1.5 }[difficulty] || 1
      return sum + (weight * difficultyMultiplier * 2) // Base 2 hours per unit weight
    }, 0)

    // Get existing study sessions for this day
    const existingSessions = studySessions.filter(s => s.date === dateStr)
    const plannedHours = existingSessions.reduce((sum, s) => sum + (s.duration_minutes / 60), 0)

    workloadByDay.push({
      date: dateStr,
      dayName,
      isPreferredDay,
      dueAssignments,
      assignmentCount: dueAssignments.length,
      estimatedHoursNeeded: estimatedHours,
      plannedStudyHours: plannedHours,
      availableHours: Math.max(0, maxHoursPerDay - plannedHours),
      workloadScore: estimatedHours + (dueAssignments.length * 0.5), // Score based on hours + count
      isOverloaded: estimatedHours > maxHoursPerDay,
    })
  }

  // Identify overloaded days and suggest redistribution
  const overloadedDays = workloadByDay.filter(d => d.isOverloaded)
  const suggestions = []

  overloadedDays.forEach(overloadedDay => {
    // Find previous days with available capacity
    const dayIndex = workloadByDay.findIndex(d => d.date === overloadedDay.date)
    const previousDays = workloadByDay.slice(0, dayIndex).filter(d => d.availableHours > 1 && d.isPreferredDay)

    if (previousDays.length > 0) {
      const excessHours = overloadedDay.estimatedHoursNeeded - maxHoursPerDay
      let hoursToRedistribute = excessHours

      const redistribution = []
      for (const prevDay of previousDays.reverse()) {
        if (hoursToRedistribute <= 0) break
        const hoursToMove = Math.min(prevDay.availableHours, hoursToRedistribute)
        redistribution.push({
          date: prevDay.date,
          dayName: prevDay.dayName,
          suggestedHours: hoursToMove,
        })
        hoursToRedistribute -= hoursToMove
      }

      if (redistribution.length > 0) {
        suggestions.push({
          type: 'redistribute',
          severity: excessHours > maxHoursPerDay ? 'high' : 'medium',
          overloadedDate: overloadedDay.date,
          overloadedDayName: overloadedDay.dayName,
          excessHours: excessHours.toFixed(1),
          assignments: overloadedDay.dueAssignments.map(a => a.name),
          redistribution,
          message: `${overloadedDay.dayName} has ${overloadedDay.estimatedHoursNeeded.toFixed(1)} hours of work. Consider spreading ${excessHours.toFixed(1)} hours to earlier days.`,
        })
      }
    }
  })

  // Identify clustering (multiple heavy days in a row)
  for (let i = 0; i < workloadByDay.length - 2; i++) {
    const threeDays = workloadByDay.slice(i, i + 3)
    const totalWorkload = threeDays.reduce((sum, d) => sum + d.workloadScore, 0)
    const avgWorkload = totalWorkload / 3

    if (avgWorkload > maxHoursPerDay * 0.8 && threeDays.every(d => d.workloadScore > 2)) {
      suggestions.push({
        type: 'cluster_warning',
        severity: 'medium',
        startDate: threeDays[0].date,
        endDate: threeDays[2].date,
        message: `Heavy workload cluster detected from ${threeDays[0].dayName} to ${threeDays[2].dayName}. Consider starting some assignments earlier.`,
      })
      break // Only show one cluster warning
    }
  }

  // Calculate overall balance score (0-100)
  const avgWorkload = workloadByDay.reduce((sum, d) => sum + d.workloadScore, 0) / workloadByDay.length
  const variance = workloadByDay.reduce((sum, d) => sum + Math.pow(d.workloadScore - avgWorkload, 2), 0) / workloadByDay.length
  const balanceScore = Math.max(0, Math.min(100, 100 - (variance * 10) - (overloadedDays.length * 15)))

  return {
    workloadByDay,
    suggestions,
    summary: {
      totalAssignments: upcomingAssignments.length,
      overloadedDays: overloadedDays.length,
      balanceScore: Math.round(balanceScore),
      balanceStatus: balanceScore >= 70 ? 'good' : balanceScore >= 40 ? 'moderate' : 'poor',
      recommendation: balanceScore >= 70
        ? 'Your workload is well-balanced! Keep it up.'
        : balanceScore >= 40
        ? 'Consider redistributing some tasks to lighter days.'
        : 'Your workload needs attention. Start working on assignments earlier to avoid stress.',
    }
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    const twoWeeksLater = new Date()
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14)

    // Get upcoming assignments (grades with due dates)
    const { data: assignments } = await supabase
      .from('grades')
      .select(`
        id,
        name,
        due_date,
        category,
        weight,
        score,
        class_id,
        classes (name, color)
      `)
      .eq('user_id', user.id)
      .gte('due_date', today)
      .lte('due_date', twoWeeksLater.toISOString().split('T')[0])
      .is('score', null)
      .order('due_date')

    // Get existing study sessions
    const { data: studySessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', today)
      .lte('date', twoWeeksLater.toISOString().split('T')[0])

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const analysis = analyzeWorkload(
      assignments || [],
      studySessions || [],
      settings || {}
    )

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing workload:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

