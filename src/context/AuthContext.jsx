import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '@/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (nextUser) => {
    if (!nextUser) {
      setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', nextUser.id)
      .maybeSingle()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Could not load profile:', error.message)
    }

    const fallback = {
      id: nextUser.id,
      email: nextUser.email,
      full_name: nextUser.user_metadata?.full_name || '',
      phone: nextUser.user_metadata?.phone || '',
      role: 'customer',
    }
    const nextProfile = data || fallback
    setProfile(nextProfile)
    return nextProfile
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const nextSession = data.session ?? null
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      loadProfile(nextSession?.user ?? null).finally(() => {
        if (active) setLoading(false)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null)
      const nextUser = nextSession?.user ?? null
      setUser(nextUser)
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        loadProfile(nextUser).finally(() => setLoading(false))
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }, [])

  const signUp = useCallback(async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone || '' },
      },
    })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [])

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    })
    return { error }
  }, [])

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }, [])

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) return { error: new Error('Not signed in') }
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      if (!error && data) setProfile(data)
      return { data, error }
    },
    [user],
  )

  const refreshProfile = useCallback(() => loadProfile(user), [loadProfile, user])

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      displayName: profile?.full_name || user?.email?.split('@')[0] || 'Guest',
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
