import { useState, useCallback } from 'react'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { AGENTS } from '../agents'

export function useChat(user, agentId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const listenToChat = useCallback((uid, aid) => {
    const q = query(collection(db, 'users', uid, 'chats', aid, 'messages'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  const sendMessage = useCallback(async (text) => {
    if (!user || !text.trim() || loading) return
    setLoading(true)
    const agent = AGENTS[agentId]
    const chatRef = collection(db, 'users', user.uid, 'chats', agentId, 'messages')
    await addDoc(chatRef, { role: 'user', content: text, createdAt: serverTimestamp() })
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: agent.systemPrompt, messages: [{ role: 'user', content: text }] })
      })
      if (!res.ok) throw new Error('API error ' + res.status)
      const data = await res.json()
      const aiText = data.content?.[0]?.text || 'Sin respuesta.'
      await addDoc(chatRef, { role: 'assistant', content: aiText, agentId, createdAt: serverTimestamp() })
      await setDoc(doc(db, 'users', user.uid, 'chats', agentId), { lastMessage: text, updatedAt: serverTimestamp(), agentId }, { merge: true })
    } catch (err) {
      await addDoc(chatRef, { role: 'error', content: 'Error: ' + err.message, createdAt: serverTimestamp() })
    } finally { setLoading(false) }
  }, [user, agentId, loading])

  return { messages, loading, listenToChat, sendMessage, setMessages }
}