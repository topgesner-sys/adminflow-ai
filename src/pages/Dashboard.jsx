import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { AGENTS, AGENT_LIST } from '../agents'

function fmt(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br/>')
}

function ThinkingDots() {
  return <div className="msg ai"><div className="msg-avatar">🤔</div><div className="thinking"><span className="dot"/><span className="dot"/><span className="dot"/><span style={{fontSize:13,color:'var(--muted)',marginLeft:6}}>Procesando...</span></div></div>
}

function Bubble({ msg, agent, user }) {
  const isUser = msg.role==='user', isError = msg.role==='error'
  if (isError) return <div className="error-msg">⚠️ <strong>Error:</strong> {msg.content}</div>
  return (
    <div className={`msg ${isUser?'user':'ai'}`}>
      {!isUser && <div className="msg-avatar" style={{background:`${agent.color}22`}}>{agent.icon}</div>}
      <div style={{maxWidth:'72%'}}>
        <div className="msg-bubble" dangerouslySetInnerHTML={{__html: isUser ? msg.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : `<p>${fmt(msg.content)}</p>`}}/>
        <div className={`msg-meta ${isUser?'right':''}`}>{isUser?'Tú':agent.fullName} · {msg.createdAt?.toDate?.()?.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})??''}</div>
      </div>
      {isUser && <div className="msg-avatar user-avatar">{user?.photoURL?<img src={user.photoURL} alt="" style={{width:34,height:34,borderRadius:10}}/>:'👤'}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [agentId, setAgentId] = useState('orquestador')
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatEndRef = useRef(null), inputRef = useRef(null)
  const agent = AGENTS[agentId]
  const { messages, loading, listenToChat, sendMessage, setMessages } = useChat(user, agentId)

  useEffect(() => { if (!user) return; setMessages([]); const unsub = listenToChat(user.uid, agentId); return unsub }, [user, agentId, listenToChat, setMessages])
  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages, loading])

  const handleSend = () => {
    if (!input.trim()||loading) return
    sendMessage(input.trim()); setInput(''); inputRef.current?.focus()
  }
  const handleKey = e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()} }
  const selectAgent = id => { setAgentId(id); setSidebarOpen(window.innerWidth>768); inputRef.current?.focus() }
  const isEmpty = messages.length===0

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
          <div className="user-chip">{user?.photoURL&&<img src={user.photoURL} alt="" style={{width:24,height:24,borderRadius:6}}/>}<span>{user?.displayName?.split(' ')[0]}</span></div>
          <button className="sign-out-btn" onClick={signOut}>Salir</button>
        </div>
      </header>
      <div className="layout">
        <aside className={`sidebar ${sidebarOpen?'open':'closed'}`}>
          <div className="sidebar-section">Agentes</div>
          {AGENT_LIST.map(a=>(
            <button key={a.id} className={`agent-btn ${agentId===a.id?'active':''}`} onClick={()=>selectAgent(a.id)}>
              <div className="agent-icon-wrap" style={{background:`${a.color}22`}}>{a.icon}</div>
              <div className="agent-info"><div className="agent-name">{a.name}</div><div className="agent-subdesc">{a.desc}</div></div>
              {agentId===a.id&&<div className="active-dot"/>}
            </button>
          ))}
          <div className="sidebar-section" style={{marginTop:8}}>Cuenta</div>
          <div className="sidebar-user">{user?.photoURL&&<img src={user.photoURL} alt="" style={{width:32,height:32,borderRadius:8}}/>}<div style={{flex:1,minWidth:0}}><div className="agent-name" style={{fontSize:12}}>{user?.displayName}</div><div className="agent-subdesc" style={{fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div></div></div>
        </aside>
        <main className="main-content">
          <div className="agent-bar">
            <div className="agent-bar-left">
              <div className="agent-bar-icon" style={{background:`${agent.color}22`}}>{agent.icon}</div>
              <div><h2 className="agent-bar-title">{agent.fullName}</h2><p className="agent-bar-desc">{agent.desc}</p></div>
            </div>
            <div className="cap-list">{agent.caps.map(c=><span key={c} className="cap">{c}</span>)}</div>
          </div>
          <div className="chat-area">
            {isEmpty&&<div className="welcome-card"><div style={{fontSize:36,marginBottom:12}}>{agent.icon}</div><h3>{agent.fullName} listo</h3><p>{agent.desc}. ¿En qué te ayudo hoy?</p><div className="quick-grid">{agent.quickActions.map(q=><button key={q} className="quick-btn" onClick={()=>{setInput(q);setTimeout(handleSend,50)}}>{q}</button>)}</div></div>}
            {messages.map(m=><Bubble key={m.id} msg={m} agent={agent} user={user}/>)}
            {loading&&<ThinkingDots/>}
            <div ref={chatEndRef}/>
          </div>
          <div className="input-area">
            <div className="input-box">
              <textarea ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'}} onKeyDown={handleKey} placeholder={`Escribe tu tarea para ${agent.name}...`} rows={1} disabled={loading}/>
              <button className="send-btn" onClick={handleSend} disabled={loading||!input.trim()}>➤</button>
            </div>
            <div className="input-hint"><span>{agent.icon} {agent.name} activo</span><span>Enter para enviar · Shift+Enter nueva línea</span></div>
          </div>
        </main>
      </div>
    </div>
  )
}