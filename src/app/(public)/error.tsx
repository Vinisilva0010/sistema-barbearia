'use client'; // Error boundaries precisam ser Client Components

import { useEffect } from 'react';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aqui no futuro a gente pode plugar um Sentry pra avisar seu celular que deu erro
    console.error('ERRO CRÍTICO CAPTURADO:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F4F4F5] p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000]">
        
        <div className="w-20 h-20 bg-red-600 text-white flex items-center justify-center font-black text-5xl mx-auto mb-6 border-4 border-black">
          !
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-black">
          Pane no Sistema
        </h1>
        
        <p className="font-bold text-zinc-600 uppercase tracking-widest mb-8 border-t-4 border-black pt-6">
          Nossos servidores sofreram uma queda temporária ou sua conexão foi interrompida.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="w-full bg-black text-white py-5 font-black text-xl uppercase tracking-widest border-4 border-black hover:bg-zinc-800 transition-all shadow-[4px_4px_0px_0px_#A1A1AA] active:translate-y-1 active:shadow-none"
          >
            [ TENTAR RECONECTAR ]
          </button>
          
          <a 
            href="https://wa.me/5511999999999?text=Deu%20erro%20no%20site,%20quero%20agendar!" 
            className="w-full bg-green-500 text-black py-4 font-black text-sm uppercase tracking-widest border-4 border-black hover:bg-green-400 transition-colors"
          >
            AGENDAR VIA WHATSAPP
          </a>
        </div>
      </div>
    </div>
  );
}