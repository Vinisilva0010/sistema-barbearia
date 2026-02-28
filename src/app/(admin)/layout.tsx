'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import NotificationBell from '@/components/NotificationBell';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loadingAuth && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loadingAuth, pathname, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center">
        <p className="font-black uppercase tracking-widest animate-pulse border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_#000]">
          [ Lendo Credenciais... ]
        </p>
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) return null;

  // Link para Desktop (Sidebar)
  const DesktopNavLink = ({ href, label }: { href: string, label: string }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href}
        className={`block px-4 py-3 border-4 border-black font-black uppercase tracking-widest transition-all ${isActive ? 'bg-black text-white shadow-[4px_4px_0px_0px_#000000] translate-x-1' : 'bg-white text-black hover:bg-zinc-200 shadow-[4px_4px_0px_0px_#000000]'}`}
      >
        {label}
      </Link>
    );
  };

  // Link para Mobile (Bottom Tab)
  const MobileNavLink = ({ href, label }: { href: string, label: string }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href}
        className={`flex-1 flex items-center justify-center py-4 border-r-4 border-black last:border-r-0 font-black text-xs sm:text-sm uppercase tracking-widest transition-colors ${isActive ? 'bg-black text-white' : 'bg-white text-black active:bg-zinc-200'}`}
      >
        {label}
      </Link>
    );
  };

  return (
    // Adicionamos pb-20 no mobile para o conteúdo não ficar escondido debaixo da Tab Bar
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col md:flex-row pb-20 md:pb-0">
      
      {/* HEADER MOBILE (Aparece apenas em telas pequenas) */}
      <header className="md:hidden bg-black text-white border-b-4 border-black flex justify-between items-center p-4 sticky top-0 z-40">
        <div className="font-black text-xl uppercase tracking-tighter">
          Bigodes<span className="text-zinc-500">Cortes</span>
        </div>
        
        {/* CAIXA DE FERRAMENTAS MOBILE (SINO + SAIR) */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          
          <button 
            onClick={handleLogout}
            className="border-2 border-zinc-700 px-3 py-1 font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
          >
            [ Sair ]
          </button>
        </div>
      </header>

      {/* SIDEBAR DESKTOP (Escondida no mobile) */}
      <aside className="hidden md:flex w-72 bg-white border-r-4 border-black flex-col shadow-[4px_0px_0px_0px_#000000] sticky top-0 h-screen z-50">
        
        {/* CABEÇALHO DA SIDEBAR COM O SINO */}
        <div className="p-4 border-b-4 border-black bg-black text-white flex justify-between items-center relative z-50">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Bigodes<span className="text-zinc-500">cortes</span></h2>
            <p className="font-bold text-[10px] uppercase tracking-widest mt-1 text-zinc-400">Terminal Admin</p>
          </div>
          {/* O SINO ENTRA AQUI NO DESKTOP TAMBÉM */}
          <NotificationBell />
        </div>
        
        <nav className="flex-1 p-6 flex flex-col gap-4">
          <DesktopNavLink href="/dashboard" label="Dashboard" />
          <DesktopNavLink href="/agendamentos" label="Agendamentos" />
          <DesktopNavLink href="/avulsos" label="Caixa Avulso" />
          <DesktopNavLink href="/clientes" label="Base de Clientes" />
          <DesktopNavLink href="/planos" label="Planos Mensais" />
          <DesktopNavLink href="/config" label="Configurações" />
          {/* O link de Planos/Avulsos entrará aqui na Fase 8 */}
        </nav>

        <div className="p-6 border-t-4 border-black bg-zinc-100">
          <p className="font-bold text-xs uppercase text-zinc-500 mb-2 truncate">Operador: {user.email}</p>
          <button 
            onClick={handleLogout}
            className="w-full bg-white text-black border-4 border-black py-3 font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-colors border-dashed shadow-[4px_4px_0px_0px_#000000] active:translate-y-1 active:shadow-none"
          >
            [ Encerrar Sessão ]
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto w-full max-w-7xl mx-auto">
        {children}
      </main>

      {/* BOTTOM TAB BAR MOBILE (O segredo da experiência de App no iPhone) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t-4 border-black flex z-50 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)]">
        <MobileNavLink href="/dashboard" label="Painel" />
        <MobileNavLink href="/agendamentos" label="Agenda" />
        <MobileNavLink href="/avulsos" label="Avulsos" />
        <MobileNavLink href="/clientes" label="Clientes" />
        <MobileNavLink href="/planos" label="Planos" />
        <MobileNavLink href="/config" label="Ajustes" />
      </nav>

    </div>
  );
}