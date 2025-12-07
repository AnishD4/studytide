import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/settings - Get user settings
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If no settings exist, create default ones
  if (!data) {
    const { data: newSettings, error: insertError } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(newSettings)
  }

  return NextResponse.json(data)
}

// PUT /api/settings - Update user settings
export async function PUT(request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Remove fields that shouldn't be updated directly
  const { id, user_id, created_at, updated_at, ...updateData } = body

  const { data, error } = await supabase
    .from('user_settings')
    .update(updateData)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

