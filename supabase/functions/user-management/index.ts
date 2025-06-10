
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

// Function to generate random password
function generateRandomPassword(length: number = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
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

    const { action, ...data } = await req.json()

    switch (action) {
      case 'create_user': {
        const { email, name, role, currentUserId } = data
        
        // Check if email already exists
        const { data: existingUser } = await supabaseClient
          .from('users')
          .select('id')
          .eq('email', email)
          .single()

        if (existingUser) {
          return new Response(
            JSON.stringify({ success: false, error: 'כתובת האימייל כבר קיימת במערכת' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Generate random password
        const randomPassword = generateRandomPassword(12)
        const encryptedPassword = await encryptPassword(randomPassword)

        // Create new user
        const { data: newUser, error: createError } = await supabaseClient
          .from('users')
          .insert({
            email,
            name,
            role,
            encrypted_password: encryptedPassword,
            is_admin: role === 'מנהל מערכת',
            must_change_password: true,
            active: true
          })
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ success: false, error: 'שגיאה ביצירת משתמש' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // Log user creation
        const { data: currentUser } = await supabaseClient
          .from('users')
          .select('name, email')
          .eq('id', currentUserId)
          .single()

        if (currentUser) {
          await supabaseClient.from('audit_log').insert({
            user_id: currentUserId,
            user_email: currentUser.email,
            user_name: currentUser.name,
            action: 'user_created',
            details: `Created new user: ${email} with role: ${role}`
          })
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: newUser,
            temporaryPassword: randomPassword 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'change_password': {
        const { userId, oldPassword, newPassword } = data

        if (newPassword.length < 6) {
          return new Response(
            JSON.stringify({ success: false, error: 'סיסמה חייבת להכיל לפחות 6 תווים' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Get current user
        const { data: user, error: userError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError || !user) {
          return new Response(
            JSON.stringify({ success: false, error: 'משתמש לא נמצא' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        // If not forcing password change, verify old password
        if (!user.must_change_password && oldPassword) {
          // Verify old password logic here (similar to login)
          // ... (implement password verification)
        }

        // Encrypt new password
        const encryptedPassword = await encryptPassword(newPassword)

        // Update password
        const { error: updateError } = await supabaseClient
          .from('users')
          .update({ 
            encrypted_password: encryptedPassword,
            must_change_password: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: 'שגיאה בעדכון סיסמה' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // Log password change
        await supabaseClient.from('audit_log').insert({
          user_id: userId,
          user_email: user.email,
          user_name: user.name,
          action: 'password_changed',
          details: 'Password changed successfully'
        })

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'פעולה לא מוכרת' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

  } catch (error) {
    console.error('User management error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'שגיאה בניהול משתמש' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
