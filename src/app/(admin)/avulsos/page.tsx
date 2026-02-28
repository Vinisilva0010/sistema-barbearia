'use client';

import { useState } from 'react';
import { useServices, useBarbers } from '@/hooks/useFirebaseData';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AvulsosPage() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: barbers, isLoading: loadingBarbers } = useBarbers();

  const [serviceId, setServiceId] = useState('');
  const [barberId, setBarberId] = useState('');
  const [clientName, setClientName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // NOVO: Controle do Modal de Sucesso

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceId || !barberId) {
      alert('Selecione o operador e o serviço.'); // Esse alert mantemos só como fallback de erro do form
      return;
    }

    setIsSubmitting(true);

    const selectedService = services?.find(s => s.id === serviceId);
    const selectedBarber = barbers?.find(b => b.id === barberId);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      await addDoc(collection(db, 'appointments'), {
        clientName: clientName.trim() || 'Cliente Avulso',
        phone: 'N/A',
        serviceId,
        serviceName: selectedService?.name,
        barberId,
        barberName: selectedBarber?.name,
        date: dateStr,
        time: timeStr,
        status: 'done', 
        source: 'walk-in', 
        createdAt: serverTimestamp(),
      });

      // MORTE AO ALERT: Ativamos o nosso Modal Brutalista
      setShowSuccess(true);
      
      // Limpa o form por baixo dos panos
      setServiceId('');
      setBarberId('');
      setClientName('');
    } catch (error) {
      console.error('Erro ao lançar avulso:', error);
      alert('Falha na comunicação com a base de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se a tela estiver carregando os dados base
  if (loadingServices || loadingBarbers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-black text-xl uppercase tracking-widest animate-pulse border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_#000000]">
          [ Sincronizando Matriz... ]
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto relative">
      
      {/* O MODAL BRUTALISTA DE SUCESSO */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-8 w-full max-w-sm shadow-[8px_8px_0px_0px_#A1A1AA] animate-in zoom-in-95 duration-200 text-center">
            
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 font-black shadow-[4px_4px_0px_0px_#A1A1AA]">
              ✓
            </div>
            
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-black">
              Lançamento<br/>Efetuado
            </h3>
            <p className="font-bold text-zinc-500 mb-8 uppercase tracking-widest text-xs border-b-4 border-black pb-4">
              O valor já consta no Dashboard.
            </p>
            
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-black text-white py-5 font-black uppercase tracking-widest border-4 border-black hover:bg-zinc-800 transition-all shadow-[6px_6px_0px_0px_#A1A1AA] active:translate-y-1 active:shadow-none"
            >
              [ Próximo Cliente ]
            </button>
          </div>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="border-b-4 border-black pb-4 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Corte Avulso</h1>
        <p className="font-bold text-zinc-500 uppercase tracking-widest mt-1">Lançamento de Caixa Expresso</p>
      </div>

      {/* FORMULÁRIO EXPRESSO */}
      <form onSubmit={handleRegisterWalkIn} className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-6">
        
        <div>
          <label className="block font-black uppercase tracking-widest text-sm mb-2">Operador (Barbeiro) *</label>
          <div className="grid grid-cols-2 gap-3">
            {barbers?.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBarberId(b.id)}
                className={`py-4 px-2 border-4 border-black font-black uppercase tracking-widest text-xs sm:text-sm transition-all ${barberId === b.id ? 'bg-black text-white shadow-[4px_4px_0px_0px_#000000] translate-y-1' : 'bg-zinc-50 text-black hover:bg-zinc-200 shadow-[4px_4px_0px_0px_#000000]'}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-black uppercase tracking-widest text-sm mb-2">Serviço Executado *</label>
          <select 
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none focus:bg-white transition-colors cursor-pointer appearance-none rounded-none shadow-[4px_4px_0px_0px_#000000]"
            required
          >
            <option value="" disabled>SELECIONE A OPERAÇÃO</option>
            {services?.map(s => (
              <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t-4 border-dashed border-zinc-300">
          <label className="block font-black uppercase tracking-widest text-sm mb-2">Nome do Cliente (Opcional)</label>
          <input 
            type="text" 
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="EX: JOÃO SILVA"
            className="w-full bg-zinc-50 border-4 border-black p-4 font-bold uppercase outline-none focus:bg-zinc-200 transition-colors placeholder:text-zinc-400 shadow-[4px_4px_0px_0px_#000000]"
          />
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 bg-black text-white border-4 border-black py-5 font-black text-xl uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-[6px_6px_0px_0px_#000000] active:translate-y-1 active:shadow-none"
        >
          {isSubmitting ? 'CADASTRANDO...' : 'REGISTRAR NO CAIXA'}
        </button>
        
      </form>
    </div>
  );
}