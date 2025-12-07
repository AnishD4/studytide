import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        classes (id, name, color, icon)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if goal is being completed
    if (body.status === 'completed' && !body.completed_at) {
      body.completed_at = new Date().toISOString()

      // Create celebration notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        notification_type: 'goal_completed',
        title: '🎉 Goal Achieved!',
        message: `Congratulations! You completed your goal. Time to celebrate!`,
        related_id: id,
        related_type: 'goals',
        priority: 'high',
      })
    }

    const { data, error } = await supabase
      .from('goals')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        classes (id, name, color, icon)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

