'use client';

import { useState, useEffect } from 'react';
import { useAllAppointments } from '@/hooks/useFirebaseData';

export default function NotificationBell() {
  // Puxa os dados do Cache do React Query (NÃO GERA CUSTO NO FIREBASE!)
  const { data: appointments } = useAllAppointments(); 
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Quando o painel abre, lê o que o barbeiro já viu no passado
  useEffect(() => {
    const saved = localStorage.getItem('zanvexis_seen_apts');
    if (saved) {
      setSeenIds(JSON.parse(saved));
    }
  }, []);

  // Filtra as novidades (Ignora pausas de sistema e cancelamentos, pega só corte real)
 const newAppointments = (appointments || []).filter(
    (apt: any) => 
      !seenIds.includes(apt.id) && 
      apt.status !== 'cancelled'
  );

  const unreadCount = newAppointments.length;

  // Função para limpar o radar
  const handleClearNotifications = () => {
    if (!appointments) return;
    const allIds = appointments.map((a: any) => a.id);
    localStorage.setItem('zanvexis_seen_apts', JSON.stringify(allIds));
    setSeenIds(allIds);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* O ÍCONE DO SINO */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center hover:-translate-y-1 transition-transform relative active:translate-y-0 active:shadow-none"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-3 -right-3 bg-red-600 text-white border-2 border-black w-7 h-7 flex items-center justify-center font-black text-xs animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* O PAINEL FLUTUANTE (DROPDOWN) */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-72 md:w-80 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-black">
            <h3 className="font-black uppercase tracking-widest">Radar Central</h3>
            <button onClick={() => setIsOpen(false)} className="font-black text-red-500 hover:text-white">X</button>
          </div>

          <div className="max-h-80 overflow-y-auto p-4 flex flex-col gap-3 bg-zinc-50">
            {unreadCount === 0 ? (
              <p className="font-bold text-sm text-zinc-500 uppercase text-center py-4">
                Nenhuma novidade no front.
              </p>
            ) : (
              newAppointments.map((apt: any) => (
                <div key={apt.id} className="bg-yellow-100 border-2 border-black p-3 text-sm">
                  <p className="font-black uppercase">{apt.clientName}</p>
                  <p className="font-bold text-zinc-700 uppercase text-xs">{apt.serviceName}</p>
                  <p className="text-black font-black mt-2 bg-white border-2 border-black inline-block px-2 py-1">
                    {apt.date.split('-').reverse().join('/')} às {apt.time}
                  </p>
                </div>
              ))
            )}
          </div>

          {unreadCount > 0 && (
            <button 
              onClick={handleClearNotifications}
              className="w-full bg-red-600 text-white p-4 font-black uppercase tracking-widest hover:bg-red-700 transition-colors border-t-4 border-black"
            >
              [ LIMPAR VISÃO ]
            </button>
          )}
        </div>
      )}
    </div>
  );
}