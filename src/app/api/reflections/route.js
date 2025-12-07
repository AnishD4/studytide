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
    const classId = searchParams.get('classId')
    const type = searchParams.get('type')

    let query = supabase
      .from('reflections')
      .select(`
        *,
        classes (id, name, color, icon),
        grades (id, name, score, max_score, category)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (classId) {
      query = query.eq('class_id', classId)
    }
    if (type) {
      query = query.eq('reflection_type', type)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching reflections:', error)
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
      .from('reflections')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select(`
        *,
        classes (id, name, color, icon),
        grades (id, name, score, max_score, category)
      `)
      .single()

    if (error) throw error

    // Create a notification for reflection completion if it's marked complete
    if (body.is_completed) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        notification_type: 'reflection_completed',
        title: '✅ Reflection Completed',
        message: `Great job reflecting on "${body.title}"! Keep up the self-awareness.`,
        related_id: data.id,
        related_type: 'reflections',
        is_read: false,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating reflection:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

