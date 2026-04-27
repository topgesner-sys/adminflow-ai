import { useState, useEffect, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'

const app = initializeApp({
  apiKey:"AIzaSyAZaRbb3UugE1IOuCHrIbnccxW9frVz2Vg",
  authDomain:"adminflow-ai-2fe82.firebaseapp.com",
  projectId:"adminflow-ai-2fe82",
  storageBucket:"adminflow-ai-2fe82.firebasestorage.app",
  messagingSenderId:"163954388617",
  appId:"1:163954388617:web:2dc1d31ab321dc30f16058"
})
const auth = getAuth(app)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()

const AGENTS = {
  orquestador:{id:'orquestador',name:'Orquestador',icon:'🧠',color:'#6c63ff',desc:'Analiza y coordina agentes',caps:['análisis','delegación'],quickActions:['Organiza mi día de trabajo','Genera reporte ejecutivo','Crea plan de proyecto','Resume tareas pendientes'],system:'Eres el Agente Orquestador de AdminFlow AI. Analiza solicitudes y ejecuta tareas administrativas. SIEMPRE en español con resultados concretos.'},
  documentos:{id:'documentos',name:'Documentos',icon:'📄',color:'#43e97b',desc:'Redacta documentos profesionales',caps:['redacción','contratos'],quickActions:['Crea acta de reunión','Redacta contrato','Genera propuesta','Escribe informe'],system:'Eres el Agente de Documentos. Creas documentos corporativos completos. SIEMPRE en español.'},
  datos:{id:'datos',name:'Analista',icon:'📊',color:'#f5c842',desc:'Genera insights de datos',caps:['kpis','reportes'],quickActions:['KPIs para retail','Analiza ventas Q1-Q2','Dashboard métricas','Recomendaciones de datos'],system:'Eres el Agente Analista. Generas análisis con métricas y recomendaciones. SIEMPRE en español.'},
  email:{id:'email',name:'Email',icon:'✉️',color:'#ff6b6b',desc:'Comunicaciones profesionales',caps:['redacción','seguimiento'],quickActions:['Email post-reunión','Respuesta a queja','Propuesta comercial','Recordatorio de pago'],system:'Eres el Agente de Email. Redactas emails profesionales y efectivos. SIEMPRE en español.'},
  planificador:{id:'planificador',name:'Planificador',icon:'📅',color:'#a18cd1',desc:'Organiza tiempo y prioridades',caps:['agenda','proyectos'],quickActions:['Planifica mi semana','Prioriza con Eisenhower','Plan 30 días','Agenda optimizada'],system:'Eres el Agente Planificador. Generas planes detallados con tiempos y prioridades. SIEMPRE en español.'},
  workflow:{id:'workflow',name:'Workflows',icon:'⚙️',color:'#0ba360',desc:'Diseña automatizaciones',caps:['procesos','bpm'],quickActions:['Onboarding clientes','Automatiza facturación','Workflow aprobaciones','Mapea atención cliente'],system:'Eres el Agente de Workflows. Diseñas flujos con pasos y herramientas de automatización. SIEMPRE en español.'},
}
const AL = Object.values(AGENTS)

function fmt(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}

function Login({onLogin}){
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',fontFamily:"'Outfit',sans-serif"}}>
      <div style={{textAlign:'center',padding:'48px 40px',background:'#12121a',border:'1px solid #2a2a3d',borderRadius:20,maxWidth:400,width:'90%'}}>
        <div style={{width:56,height:56,borderRadius:14,margin:'0 auto 20px',background:'linear-gradient(135deg,#6c63ff,#ff6b6b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>⚡</div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,marginBottom:10,color:'#e8e8f0'}}>Admin<span style={{color:'#6c63ff'}}>Flow</span> AI</h1>
        <p style={{color:'#7a7a9a',fontSize:14,lineHeight:1.6,marginBottom:32}}>Sistema multi-agente de automatización administrativa.</p>
        <button onClick={onLogin} style={{width:'100%',padding:'14px 20px',background:'white',color:'#333',border:'none',borderRadius:10,cursor:'pointer',fontSize:15,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.1l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.7 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.4 4.5-4.4 5.9l6.2 5.2C40.7 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continuar con Google
        </button>
      </div>
    </div>
  )
}

function Dashboard({user,onOut}){
  const [aid,setAid]=useState('orquestador')
  const [msgs,setMsgs]=useState([])
  const [inp,setInp]=useState('')
  const [busy,setBusy]=useState(false)
  const [sb,setSb]=useState(true)
  const bot=useRef(null)
  const ag=AGENTS[aid]

  useEffect(()=>{
    setMsgs([])
    const q=query(collection(db,'users',user.uid,'chats',aid,'messages'),orderBy('createdAt','asc'))
    return onSnapshot(q,s=>setMsgs(s.docs.map(d=>({id:d.id,...d.data()}))))
  },[aid,user.uid])

  useEffect(()=>{bot.current?.scrollIntoView({behavior:'smooth'})},[msgs,busy])

  const send=async(txt)=>{
    if(!txt.trim()||busy)return
    setInp('');setBusy(true)
    const ref=collection(db,'users',user.uid,'chats',aid,'messages')
    await addDoc(ref,{role:'user',content:txt,createdAt:serverTimestamp()})
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:ag.system,messages:[{role:'user',content:txt}]})
      })
      const d=await r.json()
      await addDoc(ref,{role:'assistant',content:d.content?.[0]?.text||'Sin respuesta.',createdAt:serverTimestamp()})
    }catch(e){await addDoc(ref,{role:'error',content:'Error: '+e.message,createdAt:serverTimestamp()})}
    setBusy(false)
  }

  const s={bg:'#0a0a0f',sf:'#12121a',bd:'#2a2a3d',tx:'#e8e8f0',mu:'#7a7a9a'}
  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:s.bg,color:s.tx,fontFamily:"'Outfit',sans-serif"}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 18px',borderBottom:'1px solid '+s.bd,background:s.bg,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <button onClick={()=>setSb(x=>!x)} style={{background:'none',border:'none',color:s.mu,fontSize:17,cursor:'pointer'}}>☰</button>
          <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#6c63ff,#ff6b6b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>⚡</div>
          <span style={{fontFamily:"'DM Serif Display',serif",fontSize:16}}>Admin<span style={{color:'#6c63ff'}}>Flow</span> AI</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {user.photoURL&&<img src={user.photoURL} style={{width:26,height:26,borderRadius:7}} alt=""/>}
          <span style={{fontSize:12,color:s.mu}}>{user.displayName?.split(' ')[0]}</span>
          <button onClick={onOut} style={{background:'transparent',border:'1px solid '+s.bd,color:s.mu,fontSize:11,padding:'3px 10px',borderRadius:7,cursor:'pointer'}}>Salir</button>
        </div>
      </div>
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {sb&&<div style={{width:220,borderRight:'1px solid '+s.bd,padding:'10px 8px',overflowY:'auto',flexShrink:0,background:s.bg}}>
          <div style={{fontSize:9,fontWeight:700,color:s.mu,letterSpacing:1.5,textTransform:'uppercase',padding:'8px 8px 5px'}}>Agentes</div>
          {AL.map(a=><button key={a.id} onClick={()=>setAid(a.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 9px',borderRadius:9,border:aid===a.id?'1px solid '+s.bd:'none',background:aid===a.id?'#1a1a26':'transparent',color:aid===a.id?s.tx:s.mu,cursor:'pointer',width:'100%',textAlign:'left',marginBottom:2}}>
            <div style={{width:26,height:26,borderRadius:7,background:a.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>{a.icon}</div>
            <div style={{minWidth:0}}><div style={{fontWeight:500,fontSize:11}}>{a.name}</div><div style={{fontSize:9,color:s.mu,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.desc}</div></div>
            {aid===a.id&&<div style={{width:5,height:5,borderRadius:3,background:'#43e97b',marginLeft:'auto',flexShrink:0}}/>}
          </button>)}
        </div>}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'10px 18px',borderBottom:'1px solid '+s.bd,background:s.sf,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:9,background:ag.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{ag.icon}</div>
            <div><div style={{fontFamily:"'DM Serif Display',serif",fontSize:14}}>{ag.name}</div><div style={{fontSize:10,color:s.mu}}>{ag.desc}</div></div>
            <div style={{display:'flex',gap:4,marginLeft:'auto'}}>{ag.caps.map(c=><span key={c} style={{background:'#1a1a26',border:'1px solid '+s.bd,color:s.mu,fontSize:9,padding:'2px 7px',borderRadius:20}}>{c}</span>)}</div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:14}}>
            {msgs.length===0&&<div style={{background:'linear-gradient(135deg,rgba(108,99,255,.1),rgba(255,107,107,.07))',border:'1px solid rgba(108,99,255,.2)',borderRadius:14,padding:'24px 20px',textAlign:'center',maxWidth:500,margin:'0 auto',width:'100%'}}>
              <div style={{fontSize:28,marginBottom:8}}>{ag.icon}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,marginBottom:6}}>{ag.name} listo</div>
              <p style={{color:s.mu,fontSize:12,marginBottom:14}}>{ag.desc}. ¿En qué te ayudo?</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>{ag.quickActions.map(q=><button key={q} onClick={()=>send(q)} style={{background:'#1a1a26',border:'1px solid '+s.bd,color:s.tx,padding:'8px 10px',borderRadius:7,fontSize:11,cursor:'pointer',textAlign:'left',lineHeight:1.4}}>{q}</button>)}</div>
            </div>}
            {msgs.map(m=><div key={m.id} style={{display:'flex',gap:8,flexDirection:m.role==='user'?'row-reverse':'row'}}>
              <div style={{width:29,height:29,borderRadius:8,background:m.role==='user'?'linear-gradient(135deg,#6c63ff,#ff6b6b)':ag.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>
                {m.role==='user'?(user.photoURL?<img src={user.photoURL} style={{width:29,height:29,borderRadius:8}} alt=""/>:'👤'):ag.icon}
              </div>
              <div style={{maxWidth:'72%'}}>
                <div style={{padding:'10px 14px',borderRadius:12,fontSize:13,lineHeight:1.65,background:m.role==='user'?'linear-gradient(135deg,#6c63ff,#8b85ff)':m.role==='error'?'rgba(255,107,107,.1)':s.sf,color:m.role==='user'?'#fff':m.role==='error'?'#ff6b6b':s.tx,border:m.role==='user'?'none':m.role==='error'?'1px solid rgba(255,107,107,.3)':'1px solid '+s.bd,borderTopLeftRadius:m.role==='user'?12:3,borderTopRightRadius:m.role==='user'?3:12}} dangerouslySetInnerHTML={{__html:fmt(m.content)}}/>
                <div style={{fontSize:9,color:s.mu,marginTop:3,textAlign:m.role==='user'?'right':'left'}}>{m.role==='user'?'Tú':ag.name}</div>
              </div>
            </div>)}
            {busy&&<div style={{display:'flex',gap:8}}><div style={{width:29,height:29,borderRadius:8,background:ag.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>{ag.icon}</div><div style={{padding:'10px 14px',background:s.sf,border:'1px solid '+s.bd,borderRadius:'3px 12px 12px 12px',color:s.mu,fontSize:13}}>Procesando...</div></div>}
            <div ref={bot}/>
          </div>
          <div style={{padding:'10px 18px 14px',borderTop:'1px solid '+s.bd,background:s.sf,flexShrink:0}}>
            <div style={{display:'flex',gap:7,background:s.bg,border:'1px solid '+s.bd,borderRadius:10,padding:'8px 11px'}}>
              <textarea value={inp} onChange={e=>{setInp(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,90)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(inp)}}} placeholder={"Escribe tu tarea para "+ag.name+"..."} rows={1} disabled={busy} style={{flex:1,background:'transparent',border:'none',outline:'none',color:s.tx,fontFamily:"'Outfit',sans-serif",fontSize:13,resize:'none',lineHeight:1.5,maxHeight:90}}/>
              <button onClick={()=>send(inp)} disabled={busy||!inp.trim()} style={{width:32,height:32,background:'linear-gradient(135deg,#6c63ff,#8b85ff)',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:13,flexShrink:0,opacity:busy||!inp.trim()?0.35:1}}>➤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App(){
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    getRedirectResult(auth).then(r=>{if(r?.user)setUser(r.user)}).catch(()=>{})
    return onAuthStateChanged(auth,u=>{setUser(u);setLoading(false)})
  },[])

  if(loading)return <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',color:'#7a7a9a',fontFamily:"'Outfit',sans-serif",fontSize:14}}>Cargando AdminFlow AI...</div>
  return user
    ?<Dashboard user={user} onOut={()=>signOut(auth)}/>
    :<Login onLogin={()=>signInWithRedirect(auth,provider)}/>
}