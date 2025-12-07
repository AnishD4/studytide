/**
 * Database - DEPRECATED FOR VERCEL DEPLOYMENT
 *
 * This file used SQLite (better-sqlite3) which is NOT compatible with Vercel.
 * All database operations now use Supabase.
 *
 * MIGRATION:
 * - Use '@/lib/supabase/client' for client-side operations
 * - Use '@/lib/supabase/server' for server-side operations
 *
 * This file is kept only for backwards compatibility during migration.
 */

// Export null to prevent import errors
export default null;

// If you see an error about this file, you need to migrate your code to use Supabase.
// Example migration:
//
// OLD (SQLite):
//   import db from '@/lib/db'
//   const users = db.prepare('SELECT * FROM users').all()
//
// NEW (Supabase):
//   import { createClient } from '@/lib/supabase/server'
//   const supabase = await createClient()
//   const { data: users } = await supabase.from('users').select('*')

