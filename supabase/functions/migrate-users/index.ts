
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to encrypt password with AES256
async function encryptPassword(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(Deno.env.get('AES_SECRET_KEY') ?? 'default-secret-key-32-characters'),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(password)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  return Array.from(iv).join(',') + ':' + Array.from(new Uint8Array(encrypted)).join(',')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if users already exist
    const { data: existingUsers } = await supabaseClient
      .from('users')
      .select('email')

    if (existingUsers && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Users already migrated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Define the users to migrate
    const usersToMigrate = [
      {
        email: 'lidor@example.com',
        name: 'לידור',
        role: 'בודק',
        password: 'password123',
        is_admin: false
      },
      {
        email: 'moran@example.com',
        name: 'מורן',
        role: 'בודק',
        password: 'password123',
        is_admin: false
      },
      {
        email: 'chen@example.com',
        name: 'חן',
        role: 'מנהלת',
        password: 'password123',
        is_admin: false
      },
      {
        email: 'admin@system.com',
        name: 'לידור מנהל',
        role: 'מנהל מערכת',
        password: 'Aa123456!',
        is_admin: true
      }
    ]

    // Encrypt passwords and prepare users for insertion
    const encryptedUsers = await Promise.all(
      usersToMigrate.map(async (user) => ({
        email: user.email,
        name: user.name,
        role: user.role,
        encrypted_password: await encryptPassword(user.password),
        is_admin: user.is_admin,
        active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    )

    // Insert users into database
    const { data: insertedUsers, error: insertError } = await supabaseClient
      .from('users')
      .insert(encryptedUsers)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: 'שגיאה בהעברת משתמשים' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Log migration
    const adminUser = insertedUsers.find(u => u.is_admin)
    if (adminUser) {
      await supabaseClient.from('audit_log').insert({
        user_id: adminUser.id,
        user_email: adminUser.email,
        user_name: adminUser.name,
        action: 'system_migration',
        details: `Migrated ${insertedUsers.length} users to Supabase`
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully migrated ${insertedUsers.length} users`,
        users: insertedUsers.map(u => ({ email: u.email, name: u.name, role: u.role }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'שגיאה במיגרציה' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
