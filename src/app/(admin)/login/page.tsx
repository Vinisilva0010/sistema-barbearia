'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Login bem sucedido, redireciona para o painel de controle
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Falha na autenticação:', err);
      setError('Credenciais inválidas ou acesso negado.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000]">
        
        <div className="border-b-4 border-black pb-4 mb-8 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Acesso Restrito</h1>
          <p className="font-bold text-zinc-500 uppercase tracking-widest mt-1">Terminal de Comando</p>
        </div>

        {error && (
          <div className="bg-black text-white p-4 mb-6 border-4 border-black text-center font-bold uppercase text-sm tracking-widest animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div>
            <label className="block font-black uppercase tracking-widest text-sm mb-2">Credencial (E-mail)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-50 border-4 border-black p-4 font-bold uppercase outline-none focus:bg-zinc-200 transition-colors shadow-[4px_4px_0px_0px_#000000]"
              required
            />
          </div>

          <div>
            <label className="block font-black uppercase tracking-widest text-sm mb-2">Código de Segurança</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-50 border-4 border-black p-4 font-bold outline-none focus:bg-zinc-200 transition-colors shadow-[4px_4px_0px_0px_#000000]"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-black text-white border-4 border-black py-4 mt-4 font-black text-xl uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 shadow-[6px_6px_0px_0px_#000000] active:translate-y-1 active:shadow-none transition-all"
          >
            {isAuthenticating ? 'VERIFICANDO...' : 'INICIAR SESSÃO'}
          </button>
        </form>

      </div>
    </div>
  );
}