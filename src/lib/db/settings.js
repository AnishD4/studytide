import { createClient } from '@/lib/supabase/server'

// Get user settings
export async function getUserSettings(userId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user settings:', error)
    return null
  }

  return data
}

// Update user settings
export async function updateUserSettings(userId, settings) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user settings:', error)
    return { error: error.message }
  }

  return { data }
}

// Get user profile
export async function getUserProfile(userId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

// Update user profile
export async function updateUserProfile(userId, profile) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return { error: error.message }
  }

  return { data }
}

