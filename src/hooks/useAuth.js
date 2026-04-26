import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, provider } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false) })
    return unsub
  }, [])
  const signIn = () => signInWithPopup(auth, provider)
  const signOut = () => firebaseSignOut(auth)
  return { user, loading, signIn, signOut }
}