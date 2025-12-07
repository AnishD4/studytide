import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const classId = searchParams.get('classId')

    let query = supabase
      .from('study_sessions')
      .select(`
        *,
        classes (id, name, color, icon)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching study sessions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select(`
        *,
        classes (id, name, color, icon)
      `)
      .single()

    if (error) throw error

    // Update study streak
    await updateStudyStreak(supabase, user.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating study session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function updateStudyStreak(supabase, userId) {
  const today = new Date().toISOString().split('T')[0]

  // Get or create study streak
  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', 'study')
    .single()

  if (!streak) {
    // Create new streak
    await supabase.from('streaks').insert({
      user_id: userId,
      streak_type: 'study',
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      streak_start_date: today,
      total_days: 1,
    })
  } else {
    const lastDate = streak.last_activity_date
    const lastDateObj = new Date(lastDate)
    const todayObj = new Date(today)
    const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Already logged today, no update needed
      return
    } else if (diffDays === 1) {
      // Consecutive day - increase streak
      const newStreak = streak.current_streak + 1
      await supabase
        .from('streaks')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_activity_date: today,
          total_days: streak.total_days + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id)
    } else {
      // Streak broken - start new
      await supabase
        .from('streaks')
        .update({
          current_streak: 1,
          last_activity_date: today,
          streak_start_date: today,
          total_days: streak.total_days + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id)
    }
  }
}

