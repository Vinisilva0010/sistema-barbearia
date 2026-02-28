'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    // 1. Checa se o cara já viu a tela nessa sessão (Memória RAM do navegador)
    //const hasSeenSplash = sessionStorage.getItem('zanvexis_splash');
    
    //if (hasSeenSplash) {
     // setShow(false); // Se já viu, ignora a tela de carregamento na hora
    //  return;
  //  }

    // 2. A Mágica: Mostra por 1.5s, começa a sumir, e aos 2s destrói o componente
    const timerOut = setTimeout(() => setAnimateOut(true), 1500);
    const timerDestroy = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('zanvexis_splash', 'true'); // Grava que ele já viu
    }, 2000);

    return () => {
      clearTimeout(timerOut);
      clearTimeout(timerDestroy);
    };
  }, []);

  if (!show) return null;

  return (
    // z-[9999] garante que fica por cima de TUDO no aplicativo
    <div className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
      
      <div className="animate-pulse flex flex-col items-center">
        {/* Símbolo Temporário (Você pode trocar pela sua tag <img src="/logo.png" /> depois) */}
       <div className="mb-8 flex items-center justify-center">
          <img 
            src="/icons/icon-512x512.png" // <-- SE O NOME DA SUA IMAGEM FOR OUTRO, MUDE AQUI!
            alt="Logo Bigodes Cortes" 
            className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain drop-shadow-[0_0_50px_rgba(250,204,21,0.8)] hover:scale-105 transition-transform"
          />
        </div>
        
        <h1 className="text-white font-black text-3xl uppercase tracking-widest">Bigodes Cortes</h1>
        <p className="text-zinc-500 text-xs font-bold tracking-[0.3em] mt-4 border-t-2 border-zinc-800 pt-2">
          [ INICIANDO SISTEMA ]
        </p>
         <p className="text-zinc-500 text-xs font-bold tracking-[0.3em] mt-4 border-t-2 border-zinc-800 pt-2">
          [ Zanvexis.com ]
        </p>
      </div>

    </div>
  );
}