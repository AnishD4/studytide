import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('activity_hours')
      .select('*')
      .eq('extracurricular_id', id)
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching hours:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('activity_hours')
      .insert({
        ...body,
        user_id: user.id,
        extracurricular_id: id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating hours entry:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

