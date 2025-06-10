
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { email, password } = await req.json()

    // Get user from database
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'משתמש לא נמצא או לא פעיל' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Decrypt and verify password using AES256
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(Deno.env.get('AES_SECRET_KEY') ?? 'default-secret-key-32-characters'),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    try {
      const encryptedData = user.encrypted_password.split(':')
      const iv = new Uint8Array(encryptedData[0].split(',').map(Number))
      const encrypted = new Uint8Array(encryptedData[1].split(',').map(Number))

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      )

      const decryptedPassword = new TextDecoder().decode(decrypted)

      if (decryptedPassword !== password) {
        // Log failed login attempt
        await supabaseClient.from('audit_log').insert({
          user_id: user.id,
          user_email: email,
          user_name: user.name,
          action: 'login_failed',
          details: 'Failed login attempt - invalid password'
        })

        return new Response(
          JSON.stringify({ success: false, error: 'סיסמה שגויה' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
    } catch (decryptError) {
      console.error('Decryption error:', decryptError)
      return new Response(
        JSON.stringify({ success: false, error: 'שגיאה באימות' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update last login
    await supabaseClient
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Log successful login
    await supabaseClient.from('audit_log').insert({
      user_id: user.id,
      user_email: email,
      user_name: user.name,
      action: 'login_success',
      details: 'User logged in successfully'
    })

    // Create session token (simple JWT-like token)
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.is_admin,
      mustChangePassword: user.must_change_password,
      lastLogin: new Date().toISOString()
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: sessionData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'שגיאה בהתחברות' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
