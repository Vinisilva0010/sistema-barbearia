'use client';

import { useState } from 'react';
import { useAllAppointments, useServices, useBarbers } from '@/hooks/useFirebaseData';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardPage() {
  const { data: appointments, isLoading: loadingApts, refetch: refetchApts } = useAllAppointments();
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: barbers, isLoading: loadingBarbers } = useBarbers();

  // Estados do Almoço Dinâmico Livre / Pausa
  const [pauseDate, setPauseDate] = useState('');
  const [pauseBarberId, setPauseBarberId] = useState('');
  const [pauseStart, setPauseStart] = useState('');
  const [pauseEnd, setPauseEnd] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  // Função para injetar a pausa dinamicamente no banco
  const handleDynamicPause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pauseBarberId || !pauseDate || !pauseStart || !pauseEnd) {
      alert('Selecione o operador, a data, início e fim da pausa.');
      return;
    }

    setIsBlocking(true);
    const selectedBarber = barbers?.find(b => b.id === pauseBarberId);

    try {
      await addDoc(collection(db, 'appointments'), {
        clientName: `PAUSA: ${pauseStart} às ${pauseEnd}`,
        phone: 'N/A',
        serviceId: 'pause-block',
        serviceName: 'HORÁRIO BLOQUEADO',
        barberId: pauseBarberId,
        barberName: selectedBarber?.name,
        date: pauseDate,
        time: pauseStart,
        endTime: pauseEnd,
        status: 'done', // Ocupa a vaga no motor
        source: 'system-block',
        createdAt: serverTimestamp(),
      });

      alert('PAUSA CONFIRMADA! Horário retirado da vitrine pública.');
      setPauseBarberId('');
      setPauseStart('');
      setPauseEnd('');
      refetchApts();
    } catch (error) {
      console.error(error);
      alert('Erro ao bloquear horário.');
    } finally {
      setIsBlocking(false);
    }
  };

  // Função para cancelar a pausa e voltar ao trabalho
  const handleCancelPause = async (id: string) => {
    if (!window.confirm('Retornar ao trabalho? A agenda será liberada imediatamente.')) return;
    try {
      await updateDoc(doc(db, 'appointments', id), { status: 'cancelled' });
      refetchApts();
    } catch (error) {
      console.error(error);
      alert('Erro ao liberar agenda.');
    }
  };

  if (loadingApts || loadingServices || loadingBarbers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-black text-xl uppercase tracking-widest animate-pulse border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_#000000]">
          [ Sincronizando Matriz Financeira... ]
        </p>
      </div>
    );
  }

  // Cálculos Financeiros (Exclui os bloqueios de pausa para não somar no caixa)
  const validAppointments = appointments?.filter((a: any) => a.status !== 'cancelled' && a.source !== 'system-block') || [];
  const cancelledAppointments = appointments?.filter((a: any) => a.status === 'cancelled') || [];
const activePauses = appointments?.filter((a: any) => a.source === 'system-block' && a.status !== 'cancelled') || [];

  let projectedRevenue = 0;
  validAppointments.forEach((apt: any) => {
    const service = services?.find(s => s.id === apt.serviceId);
    if (service) projectedRevenue += service.price;
  });

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="border-b-4 border-black pb-4">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Visão Geral</h1>
        <p className="font-bold text-zinc-500 uppercase tracking-widest mt-1">Métricas de Operação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 transition-all">
          <p className="font-bold text-sm text-zinc-500 uppercase tracking-widest mb-4 border-b-2 border-black pb-2">Receita Projetada</p>
          <p className="text-4xl md:text-5xl font-black uppercase truncate">R$ {projectedRevenue.toFixed(2).replace('.', ',')}</p>
        </div>

        <div className="bg-black text-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#A1A1AA] hover:-translate-y-1 transition-all">
          <p className="font-bold text-sm text-zinc-400 uppercase tracking-widest mb-4 border-b-2 border-zinc-700 pb-2">Cortes Confirmados</p>
          <p className="text-4xl md:text-5xl font-black uppercase">{validAppointments.length} <span className="text-2xl text-zinc-500">OPs</span></p>
        </div>

        <div className="bg-zinc-200 border-4 border-dashed border-black p-6 hover:bg-zinc-300 transition-colors">
          <p className="font-bold text-sm text-black uppercase tracking-widest mb-4 border-b-2 border-black pb-2">Evasão (Cancelados)</p>
          <p className="text-4xl md:text-5xl font-black uppercase text-zinc-600">{cancelledAppointments.length}</p>
        </div>
      </div>

      {/* MÓDULO DE ALMOÇO LIVRE E BLOQUEIO DE AGENDA */}
      <div className="mt-2 bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000]">
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 border-b-4 border-black pb-2">Controle de Pausa / Bloqueio</h2>
        <p className="font-bold text-sm text-zinc-500 uppercase mb-6 tracking-widest">
          A fome bateu ou precisa sair amanhã? Selecione o operador, a data e o horário. A agenda será travada instantaneamente.
        </p>

        <form onSubmit={handleDynamicPause} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block font-black uppercase tracking-widest text-xs mb-2">Operador</label>
            <select value={pauseBarberId} onChange={(e) => setPauseBarberId(e.target.value)} className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none cursor-pointer rounded-none">
              <option value="" disabled>QUEM VAI PAUSAR?</option>
              {barbers?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-black uppercase tracking-widest text-xs mb-2">Data da Pausa</label>
            <input type="date" value={pauseDate} onChange={(e) => setPauseDate(e.target.value)} className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none rounded-none" required />
          </div>
          <div>
            <label className="block font-black uppercase tracking-widest text-xs mb-2">Início da Pausa</label>
            <input type="time" value={pauseStart} onChange={(e) => setPauseStart(e.target.value)} className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none rounded-none" required />
          </div>
          <div>
            <label className="block font-black uppercase tracking-widest text-xs mb-2">Retorno</label>
            <input type="time" value={pauseEnd} onChange={(e) => setPauseEnd(e.target.value)} className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none rounded-none" required />
          </div>
          
          <div className="md:col-span-2 lg:col-span-4 mt-2">
            <button type="submit" disabled={isBlocking} className="w-full bg-black text-white border-4 border-black py-4 font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-[4px_4px_0px_0px_#A1A1AA] active:translate-y-1 active:shadow-none">
              {isBlocking ? 'TRAVANDO AGENDA...' : 'INICIAR PAUSA'}
            </button>
          </div>
        </form>

        {/* LISTA DE PAUSAS ATIVAS */}
       {/* LISTA DE PAUSAS ATIVAS */}
        {activePauses.length > 0 && (
          <div className="mt-8 border-t-4 border-dashed border-zinc-300 pt-6">
            <h3 className="font-black uppercase tracking-widest text-sm mb-4 border-l-4 border-black pl-2">Pausas Ativas (Sistema Travado)</h3>
            <div className="flex flex-col gap-3">
              {activePauses.map((block: any) => (
                <div key={block.id} className="bg-zinc-100 border-2 border-black p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="font-black uppercase text-lg">{block.barberName}</p>
                    <p className="font-bold text-xs uppercase text-zinc-500">{block.date.split('-').reverse().join('/')} • Das {block.time} às {block.endTime}</p>
                  </div>
                  <button 
                    onClick={() => handleCancelPause(block.id)}
                    className="w-full md:w-auto bg-white border-4 border-black text-black px-4 py-3 font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                  >
                    [ VOLTAR AO TRABALHO ]
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}