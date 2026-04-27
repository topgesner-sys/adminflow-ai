import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Inicializar Firebase en el entry point (NO puede ser tree-shaked)
const firebaseApp = initializeApp({
  apiKey: "AIzaSyAZaRbb3UugE1IOuCHrIbnccxW9frVz2Vg",
  authDomain: "adminflow-ai-2fe82.firebaseapp.com",
  projectId: "adminflow-ai-2fe82",
  storageBucket: "adminflow-ai-2fe82.firebasestorage.app",
  messagingSenderId: "163954388617",
  appId: "1:163954388617:web:2dc1d31ab321dc30f16058"
})

// Exportar globalmente para uso en toda la app
export const fbAuth = getAuth(firebaseApp)
export const fbDb = getFirestore(firebaseApp)
export const fbProvider = new GoogleAuthProvider()

// Manejar redirect result al cargar
getRedirectResult(fbAuth).catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App auth={fbAuth} db={fbDb} provider={fbProvider} />
  </React.StrictMode>
)