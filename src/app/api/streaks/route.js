import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    // Return as object keyed by streak_type
    const streaksByType = {}
    data?.forEach(streak => {
      streaksByType[streak.streak_type] = streak
    })

    return NextResponse.json(streaksByType)
  } catch (error) {
    console.error('Error fetching streaks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Initialize or reset a streak
export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { streak_type } = body
    const today = new Date().toISOString().split('T')[0]

    // Check if streak already exists
    const { data: existing } = await supabase
      .from('streaks')
      .select('id')
      .eq('user_id', user.id)
      .eq('streak_type', streak_type)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Streak already exists' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('streaks')
      .insert({
        user_id: user.id,
        streak_type: streak_type,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        streak_start_date: today,
        total_days: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating streak:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

