import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAZaRbb3UugE1IOuCHrIbnccxW9frVz2Vg",
  authDomain: "adminflow-ai-2fe82.firebaseapp.com",
  projectId: "adminflow-ai-2fe82",
  storageBucket: "adminflow-ai-2fe82.firebasestorage.app",
  messagingSenderId: "163954388617",
  appId: "1:163954388617:web:2dc1d31ab321dc30f16058"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const provider = new GoogleAuthProvider()