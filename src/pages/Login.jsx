import { useAuth } from '../hooks/useAuth'
export default function Login() {
  const { signIn } = useAuth()
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0f',fontFamily:"'Outfit',sans-serif"}}>
      <div style={{textAlign:'center',padding:'48px 40px',background:'#12121a',border:'1px solid #2a2a3d',borderRadius:20,maxWidth:400,width:'90%'}}>
        <div style={{width:56,height:56,borderRadius:14,margin:'0 auto 20px',background:'linear-gradient(135deg,#6c63ff,#ff6b6b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>⚡</div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,letterSpacing:'-0.5px',marginBottom:10,color:'#e8e8f0'}}>Admin<span style={{color:'#6c63ff'}}>Flow</span> AI</h1>
        <p style={{color:'#7a7a9a',fontSize:14,lineHeight:1.6,marginBottom:32}}>Sistema multi-agente de automatización administrativa. Inicia sesión para comenzar.</p>
        <button onClick={signIn} style={{width:'100%',padding:'13px 20px',background:'white',color:'#333',border:'none',borderRadius:10,cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:"'Outfit',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:10}} onMouseOver={e=>e.currentTarget.style.opacity=0.85} onMouseOut={e=>e.currentTarget.style.opacity=1}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.1l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.7 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.4 4.5-4.4 5.9l6.2 5.2C40.7 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continuar con Google
        </button>
        <p style={{color:'#7a7a9a',fontSize:11,marginTop:20}}>Al iniciar sesión aceptas los términos de uso</p>
      </div>
    </div>
  )
}