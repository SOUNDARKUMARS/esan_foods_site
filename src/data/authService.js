import { supabase } from '../lib/supabase'

const AUTH_STORAGE_KEY = 'juicera_auth_session'

// Automatically wipe any legacy dummy mock session
try {
  localStorage.removeItem(AUTH_STORAGE_KEY)
} catch (e) {}

// Admin Credentials
export const ADMIN_CREDENTIALS = {
  email: 'admin@123',
  password: '1212',
}

// Format Supabase user into application profile
export function formatUserFromSupabase(sbUser) {
  if (!sbUser) return null
  const email = (sbUser.email || '').toLowerCase()
  const isAdmin =
    email === ADMIN_CREDENTIALS.email.toLowerCase() ||
    email.startsWith('admin@') ||
    sbUser.user_metadata?.role === 'admin'

  return {
    id: sbUser.id,
    name:
      sbUser.user_metadata?.full_name ||
      (isAdmin ? 'System Administrator' : email.split('@')[0]) ||
      'Juicera Member',
    email: sbUser.email || email,
    role: isAdmin ? 'admin' : 'user',
    avatar:
      sbUser.user_metadata?.avatar_url ||
      (isAdmin
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'),
    loyaltyPoints: 340,
    supabaseSession: true,
  }
}

// Clear all active sessions (both local storage and Supabase)
export async function clearSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch (e) {
    // Ignore storage errors
  }
  try {
    await supabase.auth.signOut()
  } catch (e) {
    // Ignore sign out errors
  }
}

// Strictly verify session against Supabase
// If NO session is found from Supabase, it cleans up and returns null
export async function verifyCurrentSupabaseSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data || !data.session) {
      // No session found from Supabase -> log out completely
      await clearSession()
      return null
    }

    // Valid Supabase session found
    const appUser = formatUserFromSupabase(data.session.user)
    return {
      user: appUser,
      session: data.session,
      isAdmin: appUser.role === 'admin',
    }
  } catch (err) {
    await clearSession()
    return null
  }
}

// Check admin credentials
export function checkAdminCredentials(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPass = (password || '').trim()

  if (
    cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
    cleanPass === ADMIN_CREDENTIALS.password
  ) {
    const adminUser = {
      id: 'usr_admin_001',
      name: 'System Administrator',
      email: ADMIN_CREDENTIALS.email,
      role: 'admin',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      badge: 'Super Admin',
      department: 'Executive Operations',
      temporarySession: true,
    }
    return { success: true, isAdmin: true, user: adminUser }
  }
  return { success: false }
}

// -------------------------------------------------------------
// SUPABASE EMAIL OTP AUTHENTICATION
// -------------------------------------------------------------

// 1. Send OTP to email via Supabase signInWithOtp
export async function sendSupabaseEmailOtp(email) {
  const cleanEmail = (email || '').trim()
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' }
  }

  // If user entered admin@123 in the OTP field, guide them
  if (cleanEmail.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
    return {
      success: false,
      isAdminEmail: true,
      error: 'admin@123 uses direct administrative security credentials (pass: 1212).',
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data,
      message: `A verification code has been sent to ${cleanEmail}.`,
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to send OTP verification code.',
    }
  }
}

// 2. Verify Supabase Email OTP code
export async function verifySupabaseEmailOtp(email, token) {
  const cleanEmail = (email || '').trim()
  const cleanToken = (token || '').trim()

  if (!cleanEmail || !cleanToken) {
    return { success: false, error: 'Both email and verification code are required.' }
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const appUser = formatUserFromSupabase(data.user)
    return {
      success: true,
      user: appUser,
      session: data.session,
      isAdmin: appUser.role === 'admin',
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'OTP verification failed.',
    }
  }
}
