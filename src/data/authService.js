import { supabase } from '../lib/supabase'
import { normalizeIndianPhone, isValidIndianPhone } from '../services/shiprocket'

const AUTH_STORAGE_KEY = 'juicera_auth_session'

// Automatically wipe any legacy dummy mock session
try {
  localStorage.removeItem(AUTH_STORAGE_KEY)
} catch {
  // Ignore
}

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
    avatar: sbUser.user_metadata?.avatar_url || null,
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
        avatar: profile.avatar_url || sbUser.user_metadata?.avatar_url || null,
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
      avatar_url: sbUser.user_metadata?.avatar_url || null,
      role: isNewAdmin ? 'admin' : 'user',
      phone: sbUser.user_metadata?.phone || '',
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
  } catch {
    // Ignore storage errors
  }
  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session) {
      await supabase.auth.signOut()
    }
  } catch {
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
  } catch {
    return null
  }
}

// -------------------------------------------------------------
// EMAIL & PASSWORD AUTHENTICATION (NO OTP FOR RETURNING USERS)
// -------------------------------------------------------------

// 1. Sign In with Email & Password (Direct login, no OTP required)
export async function signInWithEmailPassword(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPassword = (password || '').trim()

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Please enter both your email and password.' }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    })

    if (error) {
      const msg = error.message || ''
      if (msg.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          unconfirmed: true,
          error: 'Your email has not been verified yet. Please verify your OTP code to complete registration.',
        }
      }
      if (msg.toLowerCase().includes('invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password. Please check your credentials or create an account.',
        }
      }
      return { success: false, error: msg }
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
      error: err.message || 'Unable to sign in. Please try again.',
    }
  }
}

// 2. Register with Full Name, Email, Password, and Mobile Phone (Triggers verification OTP)
export async function registerWithEmailPassword(fullName, email, password, phone = '') {
  const cleanName = (fullName || '').trim()
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanPassword = (password || '').trim()
  const cleanPhone = normalizeIndianPhone(phone)

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Email and password are required.' }
  }
  if (!cleanPhone || !isValidIndianPhone(cleanPhone)) {
    return {
      success: false,
      error: 'A valid 10-digit Indian mobile number is required to register.',
    }
  }
  if (cleanPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: cleanName || cleanEmail.split('@')[0],
          phone: cleanPhone,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Supabase returns an empty identities array if the user is already registered
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in with your password instead.',
      }
    }

    // If session is already created immediately (e.g. if email confirmation is turned off in project)
    if (data?.session) {
      const appUser = await syncUserProfile(data.user)
      return {
        success: true,
        needsOtp: false,
        user: appUser,
        session: data.session,
        isAdmin: appUser?.role === 'admin',
      }
    }

    // Verification code sent to email
    return {
      success: true,
      needsOtp: true,
      message: `Verification code sent to ${cleanEmail}. Please enter it below to activate your account.`,
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Registration failed. Please try again.',
    }
  }
}

// 3. Verify Registration OTP
export async function verifySignupOtp(email, token) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanToken = (token || '').trim()

  if (!cleanEmail || !cleanToken) {
    return { success: false, error: 'Email and verification code are required.' }
  }

  try {
    // Attempt verification with type 'signup'
    let res = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    })

    // If 'signup' fails, attempt fallback with type 'email'
    if (res.error) {
      const fallback = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      })
      if (!fallback.error) {
        res = fallback
      }
    }

    if (res.error) {
      return {
        success: false,
        error: res.error.message || 'Invalid or expired verification code.',
      }
    }

    const appUser = await syncUserProfile(res.data.user)
    return {
      success: true,
      user: appUser,
      session: res.data.session,
      isAdmin: appUser?.role === 'admin',
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'OTP verification failed.',
    }
  }
}

// 4. Resend Registration OTP
export async function resendSignupOtp(email) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' }
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    })

    if (error) {
      // Fallback to sending OTP directly
      return await sendSupabaseEmailOtp(cleanEmail)
    }

    return {
      success: true,
      message: `A fresh verification code has been dispatched to ${cleanEmail}.`,
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to resend code.',
    }
  }
}

// -------------------------------------------------------------
// SUPABASE EMAIL OTP AUTHENTICATION (FOR PASSWORDLESS / RECOVERY)
// -------------------------------------------------------------

// 1. Send OTP to email via Supabase signInWithOtp
export async function sendSupabaseEmailOtp(email) {
  const cleanEmail = (email || '').trim().toLowerCase()
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
  const cleanEmail = (email || '').trim().toLowerCase()
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

// 6. Update user's phone number anytime from account profile
export async function updateUserPhone(phone) {
  const cleanPhone = normalizeIndianPhone(phone)
  if (!isValidIndianPhone(cleanPhone)) {
    return {
      success: false,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).',
    }
  }

  try {
    // Update in Supabase Auth user_metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        phone: cleanPhone,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Also attempt updating profiles table if present
    if (data?.user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ phone: cleanPhone })
          .eq('id', data.user.id)
      } catch (pErr) {
        console.warn('Could not update phone in profiles table:', pErr)
      }
    }

    const appUser = await syncUserProfile(data.user)
    return {
      success: true,
      user: appUser,
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Unable to update phone number.',
    }
  }
}

