import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithRedirect, signOut, getRedirectResult } from 'firebase/auth'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import './index.css'

const AGENTS = {
  orquestador: { name:'Orquestador', icon:'🧠', color:'#6c63ff', prompt:'Eres el Agente Orquestador de AdminFlow AI. Analiza y ejecuta tareas administrativas con máxima calidad. SIEMPRE responde en español con resultados estructurados.' },
  documentos:  { name:'Documentos',  icon:'📄', color:'#43e97b', prompt:'Eres el Agente de Documentos. Redactas contratos, informes, actas y propuestas profesionales completas. SIEMPRE en español.' },
  datos:       { name:'Analista',    icon:'📊', color:'#f5c842', prompt:'Eres el Agente Analista. Interpretas datos, generas KPIs y reportes ejecutivos con recomendaciones. SIEMPRE en español.' },
  email:       { name:'Email',       icon:'✉️', color:'#ff6b6b', prompt:'Eres el Agente de Email. Redactas emails profesionales con asunto, cuerpo y tono apropiado. SIEMPRE en español.' },
  planificador:{ name:'Planificador',icon:'📅', color:'#a18cd1', prompt:'Eres el Agente Planificador. Organizas agenda, priorizas tareas y creas planes de acción detallados. SIEMPRE en español.' },
  workflow:    { name:'Workflows',   icon:'⚙️', color:'#0ba360', prompt:'Eres el Agente de Workflows. Diseñas automatizaciones y flujos empresariales paso a paso. SIEMPRE en español.' },
}

export default function App({ auth, db, provider }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [agentId, setAgentId] = useState('orquestador')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false) })
    return unsub
  }, [auth])

  useEffect(() => {
    if (!user || !db) return
    setMessages([])
    const q = query(collection(db,'users',user.uid,'chats',agentId,'messages'), orderBy('createdAt','asc'))
    const unsub = onSnapshot(q, snap => setMessages(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return unsub
  }, [user, agentId, db])

  const handleLogin = () => {
    if (auth && provider) signInWithRedirect(auth, provider)
  }

  const handleLogout = () => { if (auth) signOut(auth) }

  const handleSend = async () => {
    if (!input.trim() || thinking || !user || !db) return
    const text = input.trim()
    setInput('')
    setThinking(true)
    const agent = AGENTS[agentId]
    const chatRef = collection(db,'users',user.uid,'chats',agentId,'messages')
    await addDoc(chatRef, { role:'user', content:text, createdAt:serverTimestamp() })
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system:agent.prompt, messages:[{role:'user',content:text}] })
      })
      const data = await res.json()
      await addDoc(chatRef, { role:'assistant', content:data.content?.[0]?.text||'Sin respuesta.', agentId, createdAt:serverTimestamp() })
    } catch(e) {
      await addDoc(chatRef, { role:'error', content:'Error: '+e.message, createdAt:serverTimestamp() })
    }
    setThinking(false)
  }

  if (authLoading) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',color:'#7a7a9a',fontFamily:"'Outfit',sans-serif",fontSize:16}}>
      Cargando AdminFlow AI...
    </div>
  )

  if (!user) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',fontFamily:"'Outfit',sans-serif"}}>
      <div style={{textAlign:'center',padding:'48px 40px',background:'#12121a',border:'1px solid #2a2a3d',borderRadius:20,maxWidth:400,width:'90%'}}>
        <div style={{width:56,height:56,borderRadius:14,margin:'0 auto 20px',background:'linear-gradient(135deg,#6c63ff,#ff6b6b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>⚡</div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,letterSpacing:'-0.5px',marginBottom:10,color:'#e8e8f0'}}>Admin<span style={{color:'#6c63ff'}}>Flow</span> AI</h1>
        <p style={{color:'#7a7a9a',fontSize:14,lineHeight:1.6,marginBottom:32}}>Sistema multi-agente de automatización administrativa.</p>
        <button onClick={handleLogin} style={{width:'100%',padding:'14px 20px',background:'white',color:'#333',border:'none',borderRadius:10,cursor:'pointer',fontSize:15,fontWeight:600,fontFamily:"'Outfit',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'opacity 0.2s'}}
          onMouseOver={e=>e.currentTarget.style.opacity='0.85'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.1l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.7 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.4 4.5-4.4 5.9l6.2 5.2C40.7 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continuar con Google
        </button>
        <p style={{color:'#7a7a9a',fontSize:11,marginTop:16}}>Al iniciar sesión aceptas los términos de uso</p>
      </div>
    </div>
  )

  const agent = AGENTS[agentId]
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="logo"><div className="logo-icon">⚡</div><span className="logo-text">Admin<span>Flow</span> AI</span></div>
        <div className="header-right">
          <span className="badge">BETA</span>
          <div className="user-chip">{user.photoURL&&<img src={user.photoURL} alt="" style={{width:24,height:24,borderRadius:6}}/>}<span>{user.displayName?.split(' ')[0]}</span></div>
          <button className="sign-out-btn" onClick={handleLogout}>Salir</button>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar open">
          <div className="sidebar-section">Agentes</div>
          {Object.entries(AGENTS).map(([id,a])=>(
            <button key={id} className={`agent-btn ${agentId===id?'active':''}`} onClick={()=>setAgentId(id)}>
              <div className="agent-icon-wrap" style={{background:`${a.color}22`}}>{a.icon}</div>
              <div className="agent-info"><div className="agent-name">{a.name}</div></div>
              {agentId===id&&<div className="active-dot"/>}
            </button>
          ))}
          <div className="sidebar-user" style={{marginTop:'auto'}}>
            {user.photoURL&&<img src={user.photoURL} alt="" style={{width:32,height:32,borderRadius:8}}/>}
            <div style={{minWidth:0}}><div className="agent-name" style={{fontSize:12}}>{user.displayName}</div><div className="agent-subdesc" style={{fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</div></div>
          </div>
        </aside>
        <main className="main-content">
          <div className="agent-bar">
            <div className="agent-bar-left">
              <div className="agent-bar-icon" style={{background:`${agent.color}22`}}>{agent.icon}</div>
              <div><h2 className="agent-bar-title">{agent.name}</h2><p className="agent-bar-desc">Agente especializado activo</p></div>
            </div>
          </div>
          <div className="chat-area">
            {messages.length===0&&(
              <div className="welcome-card">
                <div style={{fontSize:40,marginBottom:12}}>{agent.icon}</div>
                <h3>{agent.name} listo</h3>
                <p>¿En qué te puedo ayudar hoy?</p>
              </div>
            )}
            {messages.map(m=>(
              <div key={m.id} className={`msg ${m.role==='user'?'user':'ai'}`}>
                {m.role!=='user'&&<div className="msg-avatar" style={{background:`${agent.color}22`}}>{agent.icon}</div>}
                <div style={{maxWidth:'72%'}}>
                  <div className="msg-bubble" dangerouslySetInnerHTML={{__html:m.content.replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}/>
                </div>
                {m.role==='user'&&<div className="msg-avatar user-avatar">👤</div>}
              </div>
            ))}
            {thinking&&<div className="msg ai"><div className="msg-avatar">{agent.icon}</div><div className="thinking"><span className="dot"/><span className="dot"/><span className="dot"/></div></div>}
          </div>
          <div className="input-area">
            <div className="input-box">
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}} placeholder={`Escribe tu tarea para ${agent.name}...`} rows={1} disabled={thinking} style={{flex:1,background:'transparent',border:'none',outline:'none',color:'var(--text)',fontFamily:"'Outfit',sans-serif",fontSize:14,resize:'none',lineHeight:1.5}}/>
              <button className="send-btn" onClick={handleSend} disabled={thinking||!input.trim()}>➤</button>
            </div>
            <div className="input-hint"><span>{agent.icon} {agent.name} activo</span><span>Enter para enviar</span></div>
          </div>
        </main>
      </div>
    </div>
  )
}