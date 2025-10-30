import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!error && data) {
      setProfile(data)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const updateDisplayName = async (firstName) => {
    if (!user?.id) {
      throw new Error('No user logged in')
    }

    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName })
      .eq('id', user.id)

    if (error) {
      throw error
    }

    // Refresh profile data
    await fetchProfile(user.id)
  }

  const updateEmail = async (newEmail) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    const { error } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (error) {
      throw error
    }

    // Note: Supabase will send a verification email to the new address
    // The email won't be updated until the user clicks the verification link
  }

  const updatePassword = async (currentPassword, newPassword) => {
    if (!user?.email) {
      throw new Error('No user logged in')
    }

    // First verify the current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      throw new Error('Current password is incorrect')
    }

    // Now update to the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      throw updateError
    }
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signOut,
    updateDisplayName,
    updateEmail,
    updatePassword,
  }
}

