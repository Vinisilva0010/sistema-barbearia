'use client';

import { useState } from 'react';
import { useServices, useBarbers, useMonthlyPlans } from '@/hooks/useFirebaseData';
import { collection, doc, writeBatch, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PlanosMensaisPage() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: barbers, isLoading: loadingBarbers } = useBarbers();
  const { data: plans, isLoading: loadingPlans, refetch } = useMonthlyPlans();

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [barberId, setBarberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('5'); // 5 = Sexta-feira
  const [time, setTime] = useState('18:00');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Motor Matemático: Gera as próximas 8 datas para o dia da semana escolhido
  const generateDates = (targetDay: number) => {
    const dates = [];
    const today = new Date();
    let current = new Date(today);
    
    // Avança os dias até achar o dia da semana desejado (0=Dom, 6=Sáb)
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }
    
    // Projeta 4 semanas (2 meses)
    for (let i = 0; i < 4; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() + (i * 7));
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(dateStr);
    }
    return dates;
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || phone.length < 10 || !barberId || !serviceId || !time) {
      alert('Preencha todos os dados táticos.');
      return;
    }

    setIsSubmitting(true);
    const selectedService = services?.find(s => s.id === serviceId);
    const selectedBarber = barbers?.find(b => b.id === barberId);
    const targetDates = generateDates(parseInt(dayOfWeek));

    try {
      // BATCH WRITE: Transação atômica. Ou salva os 9 documentos, ou cancela tudo.
      const batch = writeBatch(db);
      
      // 1. Cria o Contrato do Plano
      const planRef = doc(collection(db, 'monthlyPlans'));
      batch.set(planRef, {
        clientName,
        phone,
        barberId,
        barberName: selectedBarber?.name,
        serviceId,
        serviceName: selectedService?.name,
        dayOfWeek: parseInt(dayOfWeek),
        time,
        active: true,
        startDate: targetDates[0],
        createdAt: serverTimestamp()
      });

      // 2. Projeta os 8 agendamentos no futuro
      targetDates.forEach(date => {
        const aptRef = doc(collection(db, 'appointments'));
        batch.set(aptRef, {
          clientName,
          phone,
          serviceId,
          serviceName: selectedService?.name,
          barberId,
          barberName: selectedBarber?.name,
          date: date,
          time: time,
          status: 'pending',
          source: 'plan', // Tag que identifica que veio de um plano
          planId: planRef.id,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();

      setShowSuccess(true);
      refetch(); // Atualiza a lista de planos
      
      // Limpa formulário
      setClientName('');
      setPhone('');
      setBarberId('');
      setServiceId('');
      
    } catch (error) {
      console.error('Erro na projeção:', error);
      alert('Falha crítica na comunicação com a nuvem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPlan = async (planId: string) => {
    if (!window.confirm('Cerrar este contrato? Os agendamentos futuros precisarão ser cancelados manualmente na agenda.')) return;
    
    try {
      const planRef = doc(db, 'monthlyPlans', planId);
      await updateDoc(planRef, { active: false, cancelledAt: serverTimestamp() });
      refetch();
    } catch (error) {
      console.error('Erro ao cancelar plano:', error);
    }
  };

  const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  if (loadingServices || loadingBarbers || loadingPlans) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-black text-xl uppercase tracking-widest animate-pulse border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_#000000]">
          [ Carregando Módulos... ]
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto relative">
      
      {/* MODAL DE SUCESSO */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-8 w-full max-w-sm shadow-[8px_8px_0px_0px_#A1A1AA] animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 font-black shadow-[4px_4px_0px_0px_#A1A1AA]">✓</div>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-black">Contrato Selado</h3>
            <p className="font-bold text-zinc-500 mb-8 uppercase tracking-widest text-xs border-b-4 border-black pb-4">
              Agenda travada por 8 semanas.
            </p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-black text-white py-5 font-black uppercase tracking-widest border-4 border-black hover:bg-zinc-800 transition-all shadow-[6px_6px_0px_0px_#A1A1AA] active:translate-y-1 active:shadow-none"
            >
              [ FECHAR ]
            </button>
          </div>
        </div>
      )}

      {/* COLUNA ESQUERDA: FORMULÁRIO */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="border-b-4 border-black pb-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Planos Mensais</h1>
          <p className="font-bold text-zinc-500 uppercase tracking-widest mt-1">Geração de Recorrência (8 Semanas)</p>
        </div>

        <form onSubmit={handleCreatePlan} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-black uppercase tracking-widest text-sm mb-2">Cliente *</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="NOME COMPLETO" className="w-full bg-zinc-50 border-4 border-black p-4 font-bold uppercase outline-none focus:bg-zinc-200" required />
            </div>
            <div>
              <label className="block font-black uppercase tracking-widest text-sm mb-2">WhatsApp *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-zinc-50 border-4 border-black p-4 font-bold uppercase outline-none focus:bg-zinc-200" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block font-black uppercase tracking-widest text-sm mb-2">Operador *</label>
              <select value={barberId} onChange={(e) => setBarberId(e.target.value)} className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none cursor-pointer rounded-none" required>
                <option value="" disabled>SELECIONE</option>
                {barbers?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-black uppercase tracking-widest text-sm mb-2">Serviço *</label>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none cursor-pointer rounded-none" required>
                <option value="" disabled>SELECIONE</option>
                {services?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-4 border-dashed border-zinc-300">
            <div>
              <label className="block font-black uppercase tracking-widest text-sm mb-2">Dia da Semana *</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none cursor-pointer rounded-none" required>
                {daysMap.map((day, index) => <option key={index} value={index}>{day}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-black uppercase tracking-widest text-sm mb-2">Horário Fixo *</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-zinc-100 border-4 border-black p-4 font-bold uppercase outline-none rounded-none" required />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white border-4 border-black py-5 font-black text-xl uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-[6px_6px_0px_0px_#000000] active:translate-y-1 active:shadow-none">
            {isSubmitting ? 'PROJETANDO AGENDA...' : 'GERAR CONTRATO RECORRENTE'}
          </button>
        </form>
      </div>

      {/* COLUNA DIREITA: CONTRATOS ATIVOS */}
      <div className="flex-1 md:max-w-md flex flex-col gap-4">
        <h2 className="font-black text-2xl uppercase tracking-tighter border-b-4 border-black pb-2">Contratos Ativos</h2>
        
        {plans?.length === 0 ? (
          <div className="border-4 border-black p-6 text-center shadow-[4px_4px_0px_0px_#000]">
            <p className="font-bold text-zinc-500 uppercase tracking-widest">Nenhum plano rodando.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {plans?.map((plan: any) => (
              <div key={plan.id} className="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000000]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black uppercase text-xl truncate pr-2">{plan.clientName}</h3>
                  <span className="bg-black text-white font-black text-[10px] uppercase px-2 py-1">Ativo</span>
                </div>
                <p className="font-bold text-xs uppercase text-zinc-500 mb-3">{daysMap[plan.dayOfWeek]}s às {plan.time}</p>
                <p className="font-bold text-xs uppercase text-black mb-4">Com {plan.barberName} • Início: {plan.startDate.split('-').reverse().join('/')}</p>
                
                <button 
                  onClick={() => handleCancelPlan(plan.id)}
                  className="w-full border-4 border-dashed border-black bg-white text-black py-2 font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  [ Encerrar Plano ]
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}