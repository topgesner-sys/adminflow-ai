import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { auth, provider } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle redirect result on page load
    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = () => {
    // Try popup first, fall back to redirect if blocked
    signInWithPopup(auth, provider).catch((err) => {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        signInWithRedirect(auth, provider)
      }
    })
  }

  const signOut = () => firebaseSignOut(auth)

  return { user, loading, signIn, signOut }
}