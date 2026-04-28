import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth'
import { 
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const firebaseConfig = {
  apiKey: "AIzaSyAZaRbb3UugE1IOuCHrIbnccxW9frVz2Vg",
  authDomain: "adminflow-ai-2fe82.firebaseapp.com",
  projectId: "adminflow-ai-2fe82",
  storageBucket: "adminflow-ai-2fe82.firebasestorage.app",
  messagingSenderId: "163954388617",
  appId: "1:163954388617:web:2dc1d31ab321dc30f16058"
}

const fbApp = initializeApp(firebaseConfig)
const auth = getAuth(fbApp)
const db = getFirestore(fbApp)
const provider = new GoogleAuthProvider()

// Export to window so components can use them
window.__auth = auth
window.__db = db
window.__provider = provider

// Handle Google redirect (for mobile)
getRedirectResult(auth).catch(() => {})

const AGENTS = {
  orquestador: { name:'Orquestador', icon:'🧠', color:'#6c63ff', prompt:'Eres el Agente Orquestador de AdminFlow AI. Analiza y ejecuta tareas administrativas con máxima calidad profesional. SIEMPRE en español.' },
  documentos:  { name:'Documentos',  icon:'📄', color:'#43e97b', prompt:'Eres el Agente de Documentos de AdminFlow AI. Redactas contratos, informes, actas y propuestas profesionales completas. SIEMPRE en español.' },
  datos:       { name:'Analista',    icon:'📊', color:'#f5c842', prompt:'Eres el Agente Analista de AdminFlow AI. Interpretas datos y generas KPIs, reportes ejecutivos y recomendaciones. SIEMPRE en español.' },
  email:       { name:'Email',       icon:'✉️', color:'#ff6b6b', prompt:'Eres el Agente de Email de AdminFlow AI. Redactas emails profesionales con asunto, cuerpo y tono apropiado. SIEMPRE en español.' },
  planificador:{ name:'Planificador',icon:'📅', color:'#a18cd1', prompt:'Eres el Agente Planificador de AdminFlow AI. Organizas agenda, priorizas tareas y creas planes de acción. SIEMPRE en español.' },
  workflow:    { name:'Workflows',   icon:'⚙️', color:'#0ba360', prompt:'Eres el Agente de Workflows de AdminFlow AI. Diseñas automatizaciones y flujos empresariales. SIEMPRE en español.' },
}

function Login({ onLogin }) {
  return React.createElement('div', {style:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',fontFamily:"'Outfit',sans-serif"}},
    React.createElement('div', {style:{textAlign:'center',padding:'48px 40px',background:'#12121a',border:'1px solid #2a2a3d',borderRadius:20,maxWidth:400,width:'90%'}},
      React.createElement('div', {style:{width:56,height:56,borderRadius:14,margin:'0 auto 20px',background:'linear-gradient(135deg,#6c63ff,#ff6b6b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}, '⚡'),
      React.createElement('h1', {style:{fontFamily:"'DM Serif Display',serif",fontSize:28,marginBottom:10,color:'#e8e8f0'}}, 
        'Admin', React.createElement('span',{style:{color:'#6c63ff'}},'Flow'), ' AI'),
      React.createElement('p', {style:{color:'#7a7a9a',fontSize:14,lineHeight:1.6,marginBottom:32}}, 'Sistema multi-agente de automatización administrativa.'),
      React.createElement('button', {
        onClick: onLogin,
        style:{width:'100%',padding:'14px 20px',background:'white',color:'#333',border:'none',borderRadius:10,cursor:'pointer',fontSize:15,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:10}
      }, 'Continuar con Google'),
      React.createElement('p', {style:{color:'#7a7a9a',fontSize:11,marginTop:16}}, 'Al iniciar sesión aceptas los términos de uso')
    )
  )
}

function App() {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [agentId, setAgentId] = React.useState('orquestador')
  const [messages, setMessages] = React.useState([])
  const [input, setInput] = React.useState('')
  const [thinking, setThinking] = React.useState(false)

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false) })
    return unsub
  }, [])

  React.useEffect(() => {
    if (!user) return
    setMessages([])
    const q = query(collection(db,'users',user.uid,'chats',agentId,'messages'), orderBy('createdAt','asc'))
    const unsub = onSnapshot(q, snap => setMessages(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return unsub
  }, [user, agentId])

  const handleLogin = () => {
    signInWithPopup(auth, provider).catch(err => {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        signInWithRedirect(auth, provider)
      }
    })
  }

  const handleLogout = () => signOut(auth)

  const handleSend = async () => {
    if (!input.trim() || thinking) return
    const text = input.trim()
    setInput('')
    setThinking(true)
    const agent = AGENTS[agentId]
    const chatRef = collection(db,'users',user.uid,'chats',agentId,'messages')
    await addDoc(chatRef, {role:'user',content:text,createdAt:serverTimestamp()})
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:agent.prompt,messages:[{role:'user',content:text}]})
      })
      const data = await res.json()
      await addDoc(chatRef, {role:'assistant',content:data.content?.[0]?.text||'Sin respuesta.',agentId,createdAt:serverTimestamp()})
    } catch(e) {
      await addDoc(chatRef, {role:'error',content:'Error: '+e.message,createdAt:serverTimestamp()})
    }
    setThinking(false)
  }

  if (loading) return React.createElement('div',{style:{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',color:'#7a7a9a',fontFamily:"'Outfit',sans-serif"}},'Cargando...')
  if (!user) return React.createElement(Login, {onLogin: handleLogin})

  const agent = AGENTS[agentId]
  return React.createElement('div', {className:'app-shell'},
    React.createElement('header', {className:'top-bar'},
      React.createElement('div', {className:'logo'},
        React.createElement('div', {className:'logo-icon'}, '⚡'),
        React.createElement('span', {className:'logo-text'}, 
          'Admin', React.createElement('span',{},'Flow'), ' AI')
      ),
      React.createElement('div', {className:'header-right'},
        React.createElement('span', {className:'badge'}, 'BETA'),
        React.createElement('div', {className:'user-chip'},
          user.photoURL && React.createElement('img',{src:user.photoURL,alt:'',style:{width:24,height:24,borderRadius:6}}),
          React.createElement('span',{}, user.displayName?.split(' ')[0])
        ),
        React.createElement('button', {className:'sign-out-btn',onClick:handleLogout}, 'Salir')
      )
    ),
    React.createElement('div', {className:'layout'},
      React.createElement('aside', {className:'sidebar open'},
        React.createElement('div', {className:'sidebar-section'}, 'Agentes'),
        ...Object.entries(AGENTS).map(([id,a]) =>
          React.createElement('button', {
            key:id,
            className:'agent-btn '+(agentId===id?'active':''),
            onClick:()=>setAgentId(id)
          },
            React.createElement('div',{className:'agent-icon-wrap',style:{background:a.color+'22'}}, a.icon),
            React.createElement('div',{className:'agent-info'},
              React.createElement('div',{className:'agent-name'},a.name)
            ),
            agentId===id && React.createElement('div',{className:'active-dot'})
          )
        ),
        React.createElement('div',{className:'sidebar-user',style:{marginTop:'auto'}},
          user.photoURL && React.createElement('img',{src:user.photoURL,alt:'',style:{width:32,height:32,borderRadius:8}}),
          React.createElement('div',{style:{minWidth:0}},
            React.createElement('div',{className:'agent-name',style:{fontSize:12}},user.displayName),
            React.createElement('div',{className:'agent-subdesc',style:{fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},user.email)
          )
        )
      ),
      React.createElement('main', {className:'main-content'},
        React.createElement('div', {className:'agent-bar'},
          React.createElement('div', {className:'agent-bar-left'},
            React.createElement('div',{className:'agent-bar-icon',style:{background:agent.color+'22'}},agent.icon),
            React.createElement('div',{},
              React.createElement('h2',{className:'agent-bar-title'},agent.name),
              React.createElement('p',{className:'agent-bar-desc'},'Agente especializado activo')
            )
          )
        ),
        React.createElement('div', {className:'chat-area'},
          messages.length===0 && React.createElement('div',{className:'welcome-card'},
            React.createElement('div',{style:{fontSize:40,marginBottom:12}},agent.icon),
            React.createElement('h3',{},agent.name+' listo'),
            React.createElement('p',{},'¿En qué te puedo ayudar hoy?')
          ),
          ...messages.map(m =>
            React.createElement('div',{key:m.id,className:'msg '+(m.role==='user'?'user':'ai')},
              m.role!=='user' && React.createElement('div',{className:'msg-avatar',style:{background:agent.color+'22'}},agent.icon),
              React.createElement('div',{style:{maxWidth:'72%'}},
                React.createElement('div',{className:'msg-bubble',dangerouslySetInnerHTML:{__html:m.content.replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}})
              ),
              m.role==='user' && React.createElement('div',{className:'msg-avatar user-avatar'},'👤')
            )
          ),
          thinking && React.createElement('div',{className:'msg ai'},
            React.createElement('div',{className:'msg-avatar'},agent.icon),
            React.createElement('div',{className:'thinking'},
              React.createElement('span',{className:'dot'}),
              React.createElement('span',{className:'dot'}),
              React.createElement('span',{className:'dot'})
            )
          )
        ),
        React.createElement('div', {className:'input-area'},
          React.createElement('div', {className:'input-box'},
            React.createElement('textarea',{
              value:input,
              onChange:e=>setInput(e.target.value),
              onKeyDown:e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}},
              placeholder:'Escribe tu tarea para '+agent.name+'...',
              rows:1,
              disabled:thinking,
              style:{flex:1,background:'transparent',border:'none',outline:'none',color:'var(--text)',fontFamily:"'Outfit',sans-serif",fontSize:14,resize:'none',lineHeight:1.5}
            }),
            React.createElement('button',{className:'send-btn',onClick:handleSend,disabled:thinking||!input.trim()},'➤')
          ),
          React.createElement('div',{className:'input-hint'},
            React.createElement('span',{},agent.icon+' '+agent.name+' activo'),
            React.createElement('span',{},'Enter para enviar')
          )
        )
      )
    )
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, {}, React.createElement(App))
)