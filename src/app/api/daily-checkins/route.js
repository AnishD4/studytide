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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found

    return NextResponse.json(data || null)
  } catch (error) {
    console.error('Error fetching daily check-in:', error)
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
    const date = body.date || new Date().toISOString().split('T')[0]

    // Check if check-in already exists for this date
    const { data: existing } = await supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', date)
      .single()

    if (existing) {
      // Update existing check-in
      const { data, error } = await supabase
        .from('daily_checkins')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Create new check-in
    const { data, error } = await supabase
      .from('daily_checkins')
      .insert({
        ...body,
        user_id: user.id,
        date: date,
      })
      .select()
      .single()

    if (error) throw error

    // Update login streak
    await updateLoginStreak(supabase, user.id, date)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating daily check-in:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function updateLoginStreak(supabase, userId, today) {
  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', 'login')
    .single()

  if (!streak) {
    await supabase.from('streaks').insert({
      user_id: userId,
      streak_type: 'login',
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
      return
    } else if (diffDays === 1) {
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

