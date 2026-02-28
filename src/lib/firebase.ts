import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // <-- 1. IMPORTAÇÃO DO MÓDULO DE ARQUIVOS

// O Firebase não vai quebrar se as variáveis não estiverem no .env localmente ainda, 
// mas lembre-se de colocar isso no seu .env.local depois.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton Pattern: Só inicializa se não existir nenhuma instância rodando
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // <-- 2. INICIALIZAÇÃO DO STORAGE CONECTADO AO SEU APP

export { app, db, auth, storage }; // <-- 3. EXPORTAÇÃO LIBERADA PARA O RESTO DO SISTEMA