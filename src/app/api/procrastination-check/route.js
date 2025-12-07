import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Check for procrastination risks and create warning notifications
export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    const fiveDaysFromNow = new Date(today)
    fiveDaysFromNow.setDate(today.getDate() + 5)

    // Get upcoming grades (assignments/tests) due soon without study sessions
    // This assumes grades table has a due_date field
    const { data: upcomingAssignments } = await supabase
      .from('grades')
      .select(`
        id,
        name,
        due_date,
        category,
        class_id,
        classes (name)
      `)
      .eq('user_id', user.id)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', fiveDaysFromNow.toISOString().split('T')[0])
      .is('score', null) // Not yet graded/submitted
      .order('due_date')

    const warnings = []

    for (const assignment of upcomingAssignments || []) {
      const dueDate = new Date(assignment.due_date)
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

      // Check if there are any study sessions for this class in the last week
      const oneWeekAgo = new Date(today)
      oneWeekAgo.setDate(today.getDate() - 7)

      const { data: recentSessions } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('class_id', assignment.class_id)
        .gte('date', oneWeekAgo.toISOString().split('T')[0])
        .limit(1)

      const hasRecentStudy = recentSessions && recentSessions.length > 0

      // Generate warning if:
      // - Due in 3 days or less and no recent study sessions
      // - Due in 5 days, is a test/exam, and no recent study sessions
      const isUrgent = daysUntilDue <= 3
      const isTest = ['test', 'exam', 'quiz', 'midterm', 'final'].some(
        term => assignment.category?.toLowerCase().includes(term) || assignment.name?.toLowerCase().includes(term)
      )

      if ((isUrgent || (daysUntilDue <= 5 && isTest)) && !hasRecentStudy) {
        // Check if we already sent a warning for this assignment today
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('related_id', assignment.id)
          .eq('notification_type', 'procrastination_warning')
          .gte('created_at', today.toISOString().split('T')[0])
          .single()

        if (!existingNotification) {
          const urgencyLevel = isUrgent ? 'urgent' : 'high'
          const message = isUrgent
            ? `⚠️ "${assignment.name}" for ${assignment.classes?.name || 'a class'} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}! You haven't logged any study sessions for this class recently. Start studying now!`
            : `📢 "${assignment.name}" (${assignment.category || 'assignment'}) for ${assignment.classes?.name || 'a class'} is coming up in ${daysUntilDue} days. Consider starting your preparation soon!`

          const { data: notification, error } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              notification_type: 'procrastination_warning',
              title: isUrgent ? '⚠️ Procrastination Alert!' : '📌 Upcoming Assignment',
              message,
              link: `/classes/${assignment.class_id}`,
              related_id: assignment.id,
              related_type: 'grades',
              priority: urgencyLevel,
            })
            .select()
            .single()

          if (!error && notification) {
            warnings.push(notification)
          }
        }
      }
    }

    // Also check for broken streaks
    const { data: studyStreak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('streak_type', 'study')
      .single()

    if (studyStreak && studyStreak.current_streak > 0) {
      const lastActivity = new Date(studyStreak.last_activity_date)
      const daysSinceActivity = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24))

      if (daysSinceActivity >= 1) {
        // Check if we already warned about streak today
        const { data: streakWarning } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('notification_type', 'streak_reminder')
          .gte('created_at', today.toISOString().split('T')[0])
          .single()

        if (!streakWarning) {
          const { data: notification, error } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              notification_type: 'streak_reminder',
              title: '🔥 Don\'t Break Your Streak!',
              message: `You have a ${studyStreak.current_streak}-day study streak! Log a study session today to keep it going.`,
              link: '/progress',
              priority: daysSinceActivity >= 1 ? 'high' : 'normal',
            })
            .select()
            .single()

          if (!error && notification) {
            warnings.push(notification)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      warningsCreated: warnings.length,
      warnings
    })
  } catch (error) {
    console.error('Error checking procrastination:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Get current procrastination risks (without creating notifications)
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)

    // Get upcoming assignments
    const { data: upcomingAssignments } = await supabase
      .from('grades')
      .select(`
        id,
        name,
        due_date,
        category,
        class_id,
        classes (name, color)
      `)
      .eq('user_id', user.id)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', sevenDaysFromNow.toISOString().split('T')[0])
      .is('score', null)
      .order('due_date')

    const risks = []

    for (const assignment of upcomingAssignments || []) {
      const dueDate = new Date(assignment.due_date)
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

      const oneWeekAgo = new Date(today)
      oneWeekAgo.setDate(today.getDate() - 7)

      const { data: recentSessions, count } = await supabase
        .from('study_sessions')
        .select('duration_minutes', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('class_id', assignment.class_id)
        .gte('date', oneWeekAgo.toISOString().split('T')[0])

      const totalStudyMinutes = recentSessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0

      let riskLevel = 'low'
      if (daysUntilDue <= 1 && totalStudyMinutes < 30) riskLevel = 'critical'
      else if (daysUntilDue <= 3 && totalStudyMinutes < 60) riskLevel = 'high'
      else if (daysUntilDue <= 5 && totalStudyMinutes < 60) riskLevel = 'medium'

      risks.push({
        assignment,
        daysUntilDue,
        recentStudySessions: count || 0,
        totalStudyMinutes,
        riskLevel,
      })
    }

    // Sort by risk level and due date
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    risks.sort((a, b) => {
      const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
      if (riskDiff !== 0) return riskDiff
      return a.daysUntilDue - b.daysUntilDue
    })

    return NextResponse.json(risks)
  } catch (error) {
    console.error('Error getting procrastination risks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

