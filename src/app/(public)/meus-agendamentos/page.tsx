'use client';

import { useState } from 'react';
import { useClientAppointments } from '@/hooks/useFirebaseData';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function MeusAgendamentosPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [activePhone, setActivePhone] = useState(''); // Só aciona a busca quando clicar no botão
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const { data: appointments, isLoading, refetch } = useClientAppointments(activePhone);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.length >= 10) {
      setActivePhone(phoneInput);
    } else {
      alert('Digite um número de telefone válido com DDD.');
    }
  };

  const handleCancel = async (appointmentId: string) => {
    const confirmCancel = window.confirm('TEM CERTEZA QUE DESEJA ABORTAR ESTA MISSÃO? A vaga será liberada imediatamente.');
    if (!confirmCancel) return;

    setIsCancelling(appointmentId);

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
      
      alert('AGENDAMENTO CANCELADO. Status atualizado no sistema.');
      refetch(); // Força o React Query a buscar a lista atualizada
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Falha ao comunicar com o servidor.');
    } finally {
      setIsCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] p-6 pt-10 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000000]">
        
        <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-8">
          <Link 
            href="/"
            className="font-black text-sm uppercase tracking-widest px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
          >
            [ Voltar ]
          </Link>
          <h1 className="font-black text-xl uppercase tracking-tighter">Meus Agendamentos</h1>
        </div>

        {/* ÁREA DE BUSCA */}
        <form onSubmit={handleSearch} className="mb-10 bg-zinc-100 border-4 border-black p-6">
          <label className="block font-black uppercase tracking-widest text-sm mb-2">Seu WhatsApp</label>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="tel" 
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="(11) 99999-9999"
              className="flex-1 bg-white border-4 border-black p-4 font-bold text-lg uppercase outline-none focus:bg-zinc-50 transition-colors shadow-[4px_4px_0px_0px_#000000]"
            />
            <button 
              type="submit"
              className="bg-black text-white border-4 border-black px-8 py-4 font-black uppercase tracking-widest hover:bg-zinc-800 shadow-[4px_4px_0px_0px_#000000] active:translate-y-1 active:shadow-none transition-all"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* RESULTADOS DA BUSCA */}
        {isLoading && (
          <div className="font-bold text-zinc-500 uppercase tracking-widest p-4 border-4 border-dashed border-zinc-400 text-center animate-pulse">
            [ Varrendo Banco de Dados... ]
          </div>
        )}

        {!isLoading && appointments && appointments.length === 0 && activePhone && (
          <div className="bg-white border-4 border-black p-6 text-center">
            <p className="font-black uppercase tracking-widest text-lg">Nenhum registro encontrado.</p>
            <p className="font-bold text-sm text-zinc-500 mt-2">Nenhuma trava vinculada ao número {activePhone}.</p>
          </div>
        )}

        {!isLoading && appointments && appointments.length > 0 && (
          <div className="flex flex-col gap-6">
            <h2 className="font-black uppercase tracking-widest border-l-4 border-black pl-3">Seus Registros</h2>
            
            {appointments.map((apt: any) => {
              const isPast = new Date(`${apt.date}T${apt.time}`).getTime() < new Date().getTime();
              const isCancelled = apt.status === 'cancelled';
              const isDone = apt.status === 'done';

              return (
                <div key={apt.id} className={`border-4 border-black p-5 relative shadow-[6px_6px_0px_0px_#000000] ${isCancelled ? 'bg-zinc-200 border-dashed opacity-70 shadow-none' : 'bg-white'}`}>
                  
                  {/* BADGE DE STATUS */}
                  <div className="absolute -top-3 -right-3">
                    {isCancelled ? (
                      <span className="bg-zinc-300 text-black border-2 border-black font-black uppercase text-xs px-3 py-1">Cancelado</span>
                    ) : isDone ? (
                      <span className="bg-black text-white border-2 border-black font-black uppercase text-xs px-3 py-1">Concluído</span>
                    ) : isPast ? (
                      <span className="bg-zinc-100 text-zinc-500 border-2 border-zinc-400 font-black uppercase text-xs px-3 py-1">Finalizado</span>
                    ) : (
                      <span className="bg-white text-black border-2 border-black font-black uppercase text-xs px-3 py-1 shadow-[2px_2px_0px_0px_#000]">Confirmado</span>
                    )}
                  </div>

                  <p className="font-black text-xl uppercase mb-1">{apt.serviceName}</p>
                  <p className="font-bold text-zinc-600 uppercase text-sm mb-4">Com {apt.barberName} • {apt.date.split('-').reverse().join('/')} às {apt.time}</p>

                  {/* BOTÃO DE CANCELAMENTO (Apenas se for futuro e não estiver cancelado) */}
                  {!isCancelled && !isDone && !isPast && (
                    <button 
                      onClick={() => handleCancel(apt.id)}
                      disabled={isCancelling === apt.id}
                      className="w-full border-4 border-dashed border-black bg-white text-black py-3 font-black uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                    >
                      {isCancelling === apt.id ? 'CANCELANDO...' : '[ Cancelar Horário ]'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}