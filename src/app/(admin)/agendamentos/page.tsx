'use client';

import { useState } from 'react';
import { useAllAppointments, useBarbers } from '@/hooks/useFirebaseData';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AgendamentosAdminPage() {
  const { data: appointments, isLoading: loadingApts, refetch } = useAllAppointments();
  const { data: barbers, isLoading: loadingBarbers } = useBarbers();
  
  // Estados dos Filtros Locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barberFilter, setBarberFilter] = useState('all'); // NOVO: Filtro de Barbeiro


// Estados do Bloqueio Rápido (Almoço/Pausa)
  const [blockTime, setBlockTime] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);


    
    

   
  // Controle do Modal Brutalista (Fim do window.confirm)
  const [modal, setModal] = useState<{ isOpen: boolean; id: string; action: 'done' | 'cancelled' | null }>({
    isOpen: false, id: '', action: null
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Abertura do Modal
  const requestUpdate = (id: string, action: 'done' | 'cancelled') => {
    setModal({ isOpen: true, id, action });
  };

  // Execução real no banco de dados
  const executeUpdate = async () => {
    if (!modal.id || !modal.action) return;
    
    setIsUpdating(true);
    try {
      const aptRef = doc(db, 'appointments', modal.id);
      await updateDoc(aptRef, { status: modal.action });
      refetch();
      setModal({ isOpen: false, id: '', action: null });
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Falha na comunicação com a base de dados.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Motor de Filtragem 
  const filteredAppointments = appointments?.filter((apt: any) => {
    const matchesSearch = apt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          apt.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesBarber = barberFilter === 'all' || apt.barberId === barberFilter;
    
    return matchesSearch && matchesStatus && matchesBarber;
  });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* MODAL BRUTALISTA DE CONFIRMAÇÃO (Sobrepõe a tela) */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-sm shadow-[8px_8px_0px_0px_#000] animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 border-b-4 border-black pb-2">
              {modal.action === 'cancelled' ? 'Abortar Missão?' : 'Confirmar Caixa?'}
            </h3>
            <p className="font-bold text-zinc-600 mb-6">
              {modal.action === 'cancelled' 
                ? 'Esta ação libera a vaga na agenda pública imediatamente.' 
                : 'Esta ação registra o corte como finalizado e adiciona ao fluxo de caixa.'}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={executeUpdate}
                disabled={isUpdating}
                className={`py-4 font-black uppercase tracking-widest border-4 border-black transition-all ${modal.action === 'cancelled' ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
              >
                {isUpdating ? 'PROCESSANDO...' : 'CONFIRMAR AÇÃO'}
              </button>
              <button 
                onClick={() => setModal({ isOpen: false, id: '', action: null })}
                disabled={isUpdating}
                className="py-3 font-bold text-sm text-zinc-500 uppercase tracking-widest hover:text-black underline"
              >
                Cancelar Operação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DA TELA */}
      <div className="border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Agenda Matriz</h1>
          <p className="font-bold text-zinc-500 uppercase tracking-widest mt-1">Controle de Operações</p>
        </div>
        <div className="bg-black text-white px-4 py-2 font-black uppercase tracking-widest border-4 border-black">
          Total: {filteredAppointments?.length || 0}
        </div>
      </div>

      {/* BARRA DE COMANDO (Filtros Atualizados) */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-4">
        
   

        {/* Linha 1: Busca e Barbeiro */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-black uppercase tracking-widest text-xs mb-1 text-zinc-500">Busca Rápida</label>
            <input 
              type="text" 
              placeholder="Nome ou Telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-100 border-4 border-black p-3 font-bold uppercase outline-none focus:bg-white transition-colors placeholder:text-zinc-400"
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block font-black uppercase tracking-widest text-xs mb-1 text-zinc-500">Operador (Barbeiro)</label>
            <select 
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="w-full bg-zinc-100 border-4 border-black p-3 font-bold uppercase outline-none focus:bg-white transition-colors cursor-pointer appearance-none rounded-none"
            >
              <option value="all">TODOS OS BARBEIROS</option>
              {!loadingBarbers && barbers?.map(b => (
                <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 2: Status */}
        <div className="w-full">
          <label className="block font-black uppercase tracking-widest text-xs mb-1 text-zinc-500">Status da Operação</label>
          <div className="flex bg-zinc-100 border-4 border-black p-1">
             <button 
               onClick={() => setStatusFilter('all')}
               className={`flex-1 py-2 font-black text-xs sm:text-sm uppercase tracking-widest transition-colors ${statusFilter === 'all' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
             >Tudo</button>
             <button 
               onClick={() => setStatusFilter('pending')}
               className={`flex-1 py-2 font-black text-xs sm:text-sm uppercase tracking-widest transition-colors ${statusFilter === 'pending' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
             >Pendentes</button>
             <button 
               onClick={() => setStatusFilter('done')}
               className={`flex-1 py-2 font-black text-xs sm:text-sm uppercase tracking-widest transition-colors ${statusFilter === 'done' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
             >Caixa</button>
          </div>
        </div>

      </div>

      {/* LISTAGEM DE OPERAÇÕES */}
      {loadingApts ? (
        <div className="p-10 border-4 border-dashed border-black bg-white text-center font-black uppercase tracking-widest animate-pulse">
          [ Puxando Registros da Base... ]
        </div>
      ) : filteredAppointments?.length === 0 ? (
        <div className="p-10 border-4 border-black bg-white text-center shadow-[6px_6px_0px_0px_#000000]">
          <p className="font-black text-xl uppercase tracking-widest">Nenhum registro encontrado</p>
          <p className="font-bold text-zinc-500 uppercase mt-2">Ajuste os filtros ou aguarde novas conexões.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAppointments?.map((apt: any) => {
            const isPending = apt.status === 'pending';
            const isDone = apt.status === 'done';
            const isCancelled = apt.status === 'cancelled';

            return (
              <div key={apt.id} className={`flex flex-col border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000000] relative overflow-hidden transition-all ${isCancelled ? 'opacity-70 bg-zinc-100 shadow-none' : ''}`}>
                
                <div className={`absolute left-0 top-0 bottom-0 w-3 border-r-4 border-black ${isPending ? 'bg-zinc-300' : isDone ? 'bg-black' : 'bg-transparent border-dashed'}`}></div>

                <div className="p-5 pl-8 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-xl uppercase truncate pr-2">{apt.clientName}</span>
                    <span className="bg-white border-2 border-black font-black text-xs px-2 py-1 uppercase whitespace-nowrap">
                      {apt.date.split('-').reverse().join('/')}
                    </span>
                  </div>
                  
                  <div className="font-bold text-sm text-zinc-600 uppercase tracking-widest mb-1">
                    {apt.serviceName} • {apt.time}
                  </div>
                  <div className="font-bold text-xs text-black uppercase tracking-widest mt-2 border-t-2 border-dashed border-zinc-300 pt-2">
                    Operador: {apt.barberName} • Tel: {apt.phone}
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO (Acionam o Modal em vez do confirm nativo) */}
                <div className="border-t-4 border-black flex">
                  {isPending ? (
                    <>
                      <button 
                        onClick={() => requestUpdate(apt.id, 'done')}
                        className="flex-1 bg-black text-white py-4 font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors border-r-4 border-black active:bg-zinc-700"
                      >
                        [ Confirmar ]
                      </button>
                      <button 
                        onClick={() => requestUpdate(apt.id, 'cancelled')}
                        className="flex-1 bg-white text-black py-4 font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-colors active:bg-zinc-300"
                      >
                        [ Cancelar ]
                      </button>
                    </>
                  ) : (
                    <div className={`w-full py-4 text-center font-black text-sm uppercase tracking-widest ${isDone ? 'bg-zinc-200 text-black' : 'bg-transparent text-zinc-500'}`}>
                      {isDone ? '✓ OPERAÇÃO CONCLUÍDA' : '× MISSÃO ABORTADA'}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}