import { useState, useEffect, useRef } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import './index.css'

// ── Firebase init (solo una vez) ─────────────────────────────
const FB_CONFIG = {
  apiKey: 'AIzaSyAZaRbb3UugE1IOuCHrIbnccxW9frVz2Vg',
  authDomain: 'adminflow-ai-2fe82.firebaseapp.com',
  projectId: 'adminflow-ai-2fe82',
  storageBucket: 'adminflow-ai-2fe82.firebasestorage.app',
  messagingSenderId: '163954388617',
  appId: '1:163954388617:web:2dc1d31ab321dc30f16058'
}
const fbApp = getApps().length ? getApps()[0] : initializeApp(FB_CONFIG)
const auth = getAuth(fbApp)
const db = getFirestore(fbApp)
const provider = new GoogleAuthProvider()

// ── Agents ───────────────────────────────────────────────────
const AGENTS = {
  orquestador: { name:'Orquestador', icon:'🧠', color:'#6c63ff', prompt:'Eres el Agente Orquestador de AdminFlow AI. Analiza y ejecuta tareas administrativas con máxima calidad. SIEMPRE en español. Entrega resultados estructurados y concretos.' },
  documentos:  { name:'Documentos',  icon:'📄', color:'#43e97b', prompt:'Eres el Agente de Documentos de AdminFlow AI. Redactas contratos, informes, actas y propuestas profesionales completas. SIEMPRE en español.' },
  datos:       { name:'Analista',    icon:'📊', color:'#f5c842', prompt:'Eres el Agente Analista de AdminFlow AI. Interpretas datos, generas KPIs, reportes ejecutivos y recomendaciones accionables. SIEMPRE en español.' },
  email:       { name:'Email',       icon:'✉️', color:'#ff6b6b', prompt:'Eres el Agente de Email de AdminFlow AI. Redactas emails profesionales con asunto, cuerpo y tono. SIEMPRE en español.' },
  planificador:{ name:'Planificador',icon:'📅', color:'#a18cd1', prompt:'Eres el Agente Planificador de AdminFlow AI. Organizas agenda, priorizas tareas y creas planes de acción detallados. SIEMPRE en español.' },
  workflow:    { name:'Workflows',   icon:'⚙️', color:'#0ba360', prompt:'Eres el Agente de Workflows de AdminFlow AI. Diseñas automatizaciones y flujos empresariales paso a paso con herramientas concretas. SIEMPRE en español.' },
}

// ── Login screen ─────────────────────────────────────────────
function LoginScreen() {
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errMsg, setErrMsg] = useState('')

  const handleLogin = async () => {
    setStatus('loading')
    setErrMsg('')
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // popup blocked → try redirect
        try { signInWithRedirect(auth, provider) } catch(e2) { setStatus('error'); setErrMsg(e2.message); }
      } else {
        setStatus('error')
        setErrMsg(err.message)
      }
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',fontFamily:"'Outfit',sans-serif"}}>
      <div style={{textAlign:'center',padding:'48px 40px',background:'#12121a',border:'1px solid #2a2a3d',borderRadius:20,maxWidth:400,width:'90%'}}>
        <div style={{width:56,height:56,borderRadius:14,margin:'0 auto 20px',background:'linear-gradient(135deg,#6c63ff,#ff6b6b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>⚡</div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,letterSpacing:'-0.5px',marginBottom:10,color:'#e8e8f0'}}>Admin<span style={{color:'#6c63ff'}}>Flow</span> AI</h1>
        <p style={{color:'#7a7a9a',fontSize:14,lineHeight:1.6,marginBottom:32}}>Sistema multi-agente de automatización administrativa.</p>
        {errMsg && <p style={{color:'#ff6b6b',fontSize:12,marginBottom:16,padding:'8px 12px',background:'rgba(255,107,107,0.1)',borderRadius:8}}>{errMsg}</p>}
        <button
          onClick={handleLogin}
          disabled={status==='loading'}
          style={{width:'100%',padding:'14px 20px',background:'white',color:'#333',border:'none',borderRadius:10,cursor:status==='loading'?'not-allowed':'pointer',fontSize:15,fontWeight:600,fontFamily:"'Outfit',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:10,opacity:status==='loading'?0.7:1,transition:'opacity 0.2s'}}
        >
          {status==='loading' ? '⏳ Conectando...' : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.1l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.7 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.4 4.5-4.4 5.9l6.2 5.2C40.7 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
              Continuar con Google
            </>
          )}
        </button>
        <p style={{color:'#7a7a9a',fontSize:11,marginTop:16}}>Al iniciar sesión aceptas los términos de uso</p>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ user }) {
  const [agentId, setAgentId] = useState('orquestador')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatEndRef = useRef(null)
  const agent = AGENTS[agentId]

  useEffect(() => {
    setMessages([])
    const q = query(collection(db,'users',user.uid,'chats',agentId,'messages'), orderBy('createdAt','asc'))
    return onSnapshot(q, snap => setMessages(snap.docs.map(d=>({id:d.id,...d.data()}))))
  }, [agentId, user.uid])

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages, thinking])

  const handleSend = async () => {
    if (!input.trim() || thinking) return
    const text = input.trim()
    setInput('')
    setThinking(true)
    const ref = collection(db,'users',user.uid,'chats',agentId,'messages')
    await addDoc(ref, {role:'user',content:text,createdAt:serverTimestamp()})
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:agent.prompt,messages:[{role:'user',content:text}]})
      })
      const data = await res.json()
      await addDoc(ref, {role:'assistant',content:data.content?.[0]?.text||'Sin respuesta.',agentId,createdAt:serverTimestamp()})
    } catch(e) {
      await addDoc(ref, {role:'error',content:'Error: '+e.message,createdAt:serverTimestamp()})
    }
    setThinking(false)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="logo">
          <button className="hamburger" onClick={()=>setSidebarOpen(s=>!s)}>☰</button>
          <div className="logo-icon">⚡</div>
          <span className="logo-text">Admin<span>Flow</span> AI</span>
        </div>
        <div className="header-right">
          <span className="badge">BETA</span>
          <div className="user-chip">{user.photoURL&&<img src={user.photoURL} alt="" style={{width:24,height:24,borderRadius:6}}/>}<span>{user.displayName?.split(' ')[0]}</span></div>
          <button className="sign-out-btn" onClick={()=>signOut(auth)}>Salir</button>
        </div>
      </header>
      <div className="layout">
        <aside className={`sidebar ${sidebarOpen?'open':'closed'}`}>
          <div className="sidebar-section">Agentes</div>
          {Object.entries(AGENTS).map(([id,a])=>(
            <button key={id} className={`agent-btn ${agentId===id?'active':''}`} onClick={()=>setAgentId(id)}>
              <div className="agent-icon-wrap" style={{background:`${a.color}22`}}>{a.icon}</div>
              <div className="agent-info"><div className="agent-name">{a.name}</div></div>
              {agentId===id&&<div className="active-dot"/>}
            </button>
          ))}
          <div className="sidebar-user">
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
            <div ref={chatEndRef}/>
          </div>
          <div className="input-area">
            <div className="input-box">
              <textarea value={input} onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}} placeholder={`Escribe tu tarea para ${agent.name}...`} rows={1} disabled={thinking} style={{flex:1,background:'transparent',border:'none',outline:'none',color:'var(--text)',fontFamily:"'Outfit',sans-serif",fontSize:14,resize:'none',lineHeight:1.5}}/>
              <button className="send-btn" onClick={handleSend} disabled={thinking||!input.trim()}>➤</button>
            </div>
            <div className="input-hint"><span>{agent.icon} {agent.name} activo</span><span>Enter para enviar</span></div>
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Root App ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    // Handle redirect result (mobile)
    getRedirectResult(auth).catch(()=>{})
    // Listen for auth state
    return onAuthStateChanged(auth, u => setUser(u || null))
  }, [])

  if (user === undefined) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',color:'#7a7a9a',fontFamily:"'Outfit',sans-serif",fontSize:15}}>
      Cargando...
    </div>
  )

  return user ? <Dashboard user={user} /> : <LoginScreen />
}