import { ReactNode } from 'react';
import Link from 'next/link';
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F5] text-black selection:bg-black selection:text-white">
      
      {/* HEADER FIXO E BRUTO */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-4 flex justify-between items-center shadow-[0px_4px_0px_0px_#000000]">
        <div className="font-black text-2xl uppercase tracking-tighter">
          CUT<span className="text-zinc-500">CORP</span>
        </div>
        
        {/* Menu Hamburger Brutalista (apenas visual por enquanto) */}
        <button className="flex flex-col gap-1.5 p-1 active:translate-y-0.5 transition-transform">
          <div className="w-8 h-1 bg-black"></div>
          <div className="w-8 h-1 bg-black"></div>
          <div className="w-8 h-1 bg-black"></div>
        </button>
      </header>

      {/* ÁREA DE CONTEÚDO (Com padding extra no final por causa do footer fixo) */}
      <main className="flex-1 w-full max-w-2xl mx-auto pb-32">
        {children}
      </main>

      {/* STICKY FOOTER (O segredo da conversão mobile) */}
      <footer className="fixed bottom-0 w-full bg-white border-t-4 border-black p-4 z-50 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] flex justify-center">
        <div className="w-full max-w-2xl">
         <Link href="/agendar" className="block w-full bg-black text-white text-center border-4 border-black py-4 font-black text-xl uppercase tracking-widest hover:bg-zinc-800 active:translate-y-1 transition-all">
            Agendar Agora
          </Link>
        </div>
      </footer>
      
    </div>
  );
}