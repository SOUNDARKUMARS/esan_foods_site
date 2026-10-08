import { supabase } from '../lib/supabase'

const AUTH_STORAGE_KEY = 'juicera_auth_session'

// Automatically wipe any legacy dummy mock session
try {
  localStorage.removeItem(AUTH_STORAGE_KEY)
} catch (e) {}

// Format Supabase user into application profile (fallback formatter)
export function formatUserFromSupabase(sbUser) {
  if (!sbUser) return null
  const email = (sbUser.email || '').toLowerCase()
  const isAdmin =
    sbUser.user_metadata?.role === 'admin' ||
    email.startsWith('admin@')

  return {
    id: sbUser.id,
    name:
      sbUser.user_metadata?.full_name ||
      (isAdmin ? 'System Administrator' : email.split('@')[0]) ||
      'Juicera Member',
    email: sbUser.email || email,
    role: isAdmin ? 'admin' : (sbUser.user_metadata?.role || 'user'),
    avatar:
      sbUser.user_metadata?.avatar_url ||
      (isAdmin
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'),
    phone: sbUser.user_metadata?.phone || '',
    loyaltyPoints: 50,
    supabaseSession: true,
  }
}

// Fetch or create profile in public.profiles table
export async function syncUserProfile(sbUser) {
  if (!sbUser) return null
  const email = (sbUser.email || '').toLowerCase()

  try {
    // 1. Try to read existing profile from public.profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sbUser.id)
      .maybeSingle()

    if (profile && !error) {
      const isAdmin =
        profile.role === 'admin' ||
        sbUser.user_metadata?.role === 'admin' ||
        email.startsWith('admin@')

      return {
        id: profile.id,
        name: profile.full_name || sbUser.user_metadata?.full_name || email.split('@')[0] || 'Juicera Member',
        email: profile.email || email,
        role: isAdmin ? 'admin' : (profile.role || 'user'),
        avatar:
          profile.avatar_url ||
          sbUser.user_metadata?.avatar_url ||
          (isAdmin
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'),
        phone: profile.phone || '',
        loyaltyPoints: profile.loyalty_points ?? 50,
        supabaseSession: true,
      }
    }

    // 2. Profile row doesn't exist yet: insert into public.profiles
    const isNewAdmin =
      sbUser.user_metadata?.role === 'admin' || email.startsWith('admin@')

    const newProfile = {
      id: sbUser.id,
      email: email,
      full_name:
        sbUser.user_metadata?.full_name ||
        (isNewAdmin ? 'System Administrator' : email.split('@')[0]) ||
        'Juicera Member',
      avatar_url:
        sbUser.user_metadata?.avatar_url ||
        (isNewAdmin
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'),
      role: isNewAdmin ? 'admin' : 'user',
      loyalty_points: 50,
    }

    const { data: inserted } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select('*')
      .single()

    const record = inserted || newProfile
    const isAdmin = record.role === 'admin'

    return {
      id: record.id,
      name: record.full_name,
      email: record.email,
      role: isAdmin ? 'admin' : record.role,
      avatar: record.avatar_url,
      phone: record.phone || '',
      loyaltyPoints: record.loyalty_points ?? 50,
      supabaseSession: true,
    }
  } catch (err) {
    console.warn('Unable to sync profile from database, using session fallback:', err)
    return formatUserFromSupabase(sbUser)
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
    const { data } = await supabase.auth.getSession()
    if (data?.session) {
      await supabase.auth.signOut()
    }
  } catch (e) {
    // Ignore sign out errors
  }
}

// Strictly verify session against Supabase
// If NO session is found from Supabase, safely returns null without triggering cascade sign-out
export async function verifyCurrentSupabaseSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data || !data.session) {
      return null
    }

    // Valid Supabase session found -> fetch/sync user profile from profiles table
    const appUser = await syncUserProfile(data.session.user)
    return {
      user: appUser,
      session: data.session,
      isAdmin: appUser?.role === 'admin',
    }
  } catch (err) {
    return null
  }
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

    const appUser = await syncUserProfile(data.user)
    return {
      success: true,
      user: appUser,
      session: data.session,
      isAdmin: appUser?.role === 'admin',
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'OTP verification failed.',
    }
  }
}
