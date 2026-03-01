'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppointmentStore } from '@/hooks/useAppointmentStore';
import { useServices, useBarbers, useBookedSlots } from '@/hooks/useFirebaseData';
import { generateAvailableSlots } from '@/lib/slots';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AgendarPage() {
  const router = useRouter();
  const { step, serviceId, barberId, selectedDate, selectedTime, prevStep, resetFlow } = useAppointmentStore();
  
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: barbers, isLoading: loadingBarbers } = useBarbers();
  const { data: bookedSlots, isLoading: loadingSlots } = useBookedSlots(barberId, selectedDate);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Novo controle de tela final

  const selectedBarberData = barbers?.find(b => b.id === barberId);
  const selectedServiceData = services?.find(s => s.id === serviceId);

  const dayNamesMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const displayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
      const dayOfWeekIndex = d.getDay(); 
      
      let isDayActive = true;
      if (selectedBarberData?.schedule) {
        const dayConfig = selectedBarberData.schedule.find((s: any) => s.day === dayNamesMap[dayOfWeekIndex]);
        if (dayConfig) {
          isDayActive = dayConfig.active;
        }
      }

      days.push({ 
        id: dateStr, 
        display: displayStr,
        dayOfWeek: dayNamesMap[dayOfWeekIndex],
        isActive: isDayActive 
      });
    }
    return days;
  };

  let dynamicOpenTime = '09:00'; 
  let dynamicCloseTime = '20:00';

  if (selectedBarberData?.schedule && selectedDate) {
    const [year, month, day] = selectedDate.split('-');
    const selectedDateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const dayOfWeekStr = dayNamesMap[selectedDateObj.getDay()];

    const dayConfig = selectedBarberData.schedule.find((s: any) => s.day === dayOfWeekStr);
    if (dayConfig) {
      dynamicOpenTime = dayConfig.start;
      dynamicCloseTime = dayConfig.end;
    }
  }
  
  const availableSlots = (selectedBarberData && selectedDate && bookedSlots && selectedServiceData) 
    ? generateAvailableSlots({
        openTime: dynamicOpenTime, 
        closeTime: dynamicCloseTime,
        slotDurationMin: selectedServiceData.durationMin,
        bookedSlots: bookedSlots
      })
    : [];

 const handleConfirmBooking = async () => {
    if (!clientName || clientPhone.length < 10 || !selectedTime || !selectedDate) {
      alert("Preencha todos os dados corretamente antes de confirmar.");
      return;
    }

    setIsSubmitting(true);

    
    const cleanPhone = clientPhone.replace(/\D/g, '');

    try {
      // 1. BLINDAGEM LIVE (ANTI-COLISÃO): Bate no Firebase agora para ver se alguém roubou a vaga nos últimos segundos
      const checkQuery = query(
        collection(db, 'appointments'),
        where('barberId', '==', barberId),
        where('date', '==', selectedDate),
        where('time', '==', selectedTime)
      );
      
      const snapshot = await getDocs(checkQuery);
      
      // Verifica se existe alguma ficha lá que NÃO ESTEJA cancelada
      const isTaken = snapshot.docs.some(doc => doc.data().status !== 'cancelled');

      if (isTaken) {
        alert('PUTZ! Outro cliente acabou de reservar este exato horário milissegundos antes de você. Por favor, escolha outro.');
        setIsSubmitting(false);
        useAppointmentStore.getState().prevStep(); // Joga o cara de volta pros horários
        return;
      }

      // 2. CAMINHO LIVRE: Gravação no banco com o status travando a cadeira
      await addDoc(collection(db, 'appointments'), {
        clientName,
        phone: clientPhone,
        serviceId,
        serviceName: selectedServiceData?.name,
        barberId,
        barberName: selectedBarberData?.name,
        date: selectedDate,
        time: selectedTime,
        status: 'scheduled', 
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert('Falha na comunicação com o servidor. Tente novamente.');
      setIsSubmitting(false);
    }
  };
  // Hack de Performance: Gerador de link do Google Calendar local (Sem API externa)
  const handleAddToCalendar = () => {
    if (!selectedDate || !selectedTime || !selectedServiceData) return;

    const [year, month, day] = selectedDate.split('-');
    const [hour, minute] = selectedTime.split(':');
    
    const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const endDate = new Date(startDate.getTime() + selectedServiceData.durationMin * 60000);

    const formatToGoogle = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };

    const title = encodeURIComponent(`Corte: ${selectedServiceData.name}`);
    const details = encodeURIComponent(`Agendamento com ${selectedBarberData?.name} confirmado.`);
    const location = encodeURIComponent(`CUT CORP - Rua da Engenharia, 404`);
    
    // Formato exato do Google Calendar Deep Link
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatToGoogle(startDate)}/${formatToGoogle(endDate)}&details=${details}&location=${location}`;
    
    window.open(url, '_blank');
  };

  // Hack de Retenção: Redirecionamento pro WhatsApp do Barbeiro ou Barbearia
  const handleWhatsAppNotify = () => {
    const text = encodeURIComponent(`Fala mestre! Confirmei meu agendamento pelo sistema para o dia ${selectedDate?.split('-').reverse().join('/')} às ${selectedTime}. Nome: ${clientName}.`);
    // Coloque o número oficial da barbearia aqui (com DDI e DDD, ex: 5511999999999)
    const phone = selectedBarberData?.phone || "5511999999999"; 
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // TELA DE SUCESSO ABSOLUTO (Pós-Agendamento)
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] p-6 pt-10 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000] text-center animate-in fade-in zoom-in-95 duration-500">
          
          <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            ✓
          </div>
          
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Trava Efetuada</h2>
          <p className="font-bold text-zinc-600 uppercase tracking-widest mb-8 border-b-4 border-black pb-6">
            Sua cadeira está garantida.
          </p>

          <div className="bg-zinc-100 border-4 border-black p-5 text-left mb-8 shadow-[4px_4px_0px_0px_#000000]">
            <p className="font-black text-lg uppercase">{selectedServiceData?.name} • {selectedBarberData?.name}</p>
            <p className="font-bold text-zinc-600 uppercase">{selectedDate?.split('-').reverse().join('/')} às {selectedTime}</p>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={handleAddToCalendar}
              className="w-full bg-white text-black border-4 border-black py-4 font-black uppercase tracking-widest hover:bg-zinc-100 shadow-[4px_4px_0px_0px_#000000] active:translate-y-1 active:shadow-none transition-all"
            >
              [ Adicionar à Minha Agenda ]
            </button>
            
            
          </div>

          <button 
            onClick={() => {
              resetFlow();
              router.push('/');
            }}
            className="mt-8 font-bold text-sm text-zinc-500 uppercase tracking-widest underline hover:text-black"
          >
            Voltar para o Início
          </button>

        </div>
      </div>
    );
  }

  // --- O RESTO DO COMPONENTE CONTINUA EXATAMENTE IGUAL ---
  
  const WizardHeader = () => (
    <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-8">
      <button 
        onClick={step === 1 ? () => router.push('/') : prevStep}
        className="font-black text-sm uppercase tracking-widest px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
      >
        [ Voltar ]
      </button>
      <div className="font-bold text-zinc-500 uppercase tracking-widest">
        Passo <span className="text-black font-black text-xl">{step}</span> / 5
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5] p-6 pt-10 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000000]">
        
        <WizardHeader />
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">Selecione o Serviço</h2>
            {loadingServices ? (
              <div className="font-bold text-zinc-500 uppercase tracking-widest p-4 border-4 border-dashed border-zinc-400 text-center animate-pulse">
                [ Carregando Base de Dados... ]
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {services?.map((service) => (
                  <button 
                    key={service.id}
                    onClick={() => useAppointmentStore.getState().setService(service.id)}
                    className="w-full text-left bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000000] active:translate-y-0 active:shadow-none transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-black text-xl uppercase tracking-tight block">{service.name}</span>
                        <span className="font-bold text-sm text-zinc-500 uppercase tracking-widest">{service.durationMin} Minutos</span>
                      </div>
                      <span className="bg-black text-white font-black px-3 py-1 text-sm border-2 border-black group-hover:bg-white group-hover:text-black transition-colors">
                        R$ {service.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">Escolha o Profissional</h2>
            {loadingBarbers ? (
              <div className="font-bold text-zinc-500 uppercase tracking-widest p-4 border-4 border-dashed border-zinc-400 text-center animate-pulse">
                [ Localizando Operadores... ]
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {barbers?.map((barber) => (
                  <button 
                    key={barber.id}
                    onClick={() => useAppointmentStore.getState().setBarber(barber.id)}
                    className="bg-white border-4 border-black text-left hover:-translate-y-1 transition-transform shadow-[6px_6px_0px_0px_#000000] active:translate-y-0 active:shadow-none flex flex-col overflow-hidden group"
                  >
                    {/* FOTO EM DESTAQUE (METADE SUPERIOR DO CARD) */}
                    {barber.photoUrl ? (
                      <img 
                        src={barber.photoUrl} 
                        alt={`Operador ${barber.name}`} 
                        className="w-full h-56 object-cover border-b-4 border-black grayscale-0" 
                      />
                    ) : (
                      <div className="w-full h-56 bg-zinc-200 border-b-4 border-black flex items-center justify-center font-black text-2xl text-zinc-400 uppercase tracking-widest">
                        SEM FOTO
                      </div>
                    )}
                    
                    {/* INFORMAÇÕES TÁTICAS (METADE INFERIOR) */}
                    <div className="p-5 flex flex-col gap-1 bg-white group-hover:bg-zinc-50 transition-colors">
                      <span className="font-black text-2xl uppercase tracking-tighter text-black block">
                        {barber.name}
                      </span>
                      <span className="font-bold text-sm text-zinc-500 uppercase tracking-widest">
                        {barber.specialty}
                      </span>
                      
                      {/* WHATSAPP COM SEPARADOR VISUAL */}
                      {barber.phone && barber.phone !== 'N/A' && (
                        <div className="mt-4 pt-3 border-t-2 border-dashed border-zinc-300">
                          <span className="font-black text-xs text-black uppercase tracking-widest">
                            WhatsApp Direto:
                          </span>
                          <span className="block font-bold text-sm text-zinc-600 mt-1">
                            {barber.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

       {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">Selecione a Data</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getNextDays().map((day) => (
                <button 
                  key={day.id}
                  disabled={!day.isActive}
                  onClick={() => {
                    useAppointmentStore.getState().setDate(day.id);
                    useAppointmentStore.getState().nextStep();
                  }}
                  className={`border-4 border-black py-5 text-center shadow-[4px_4px_0px_0px_#000000] transition-all 
                    ${day.isActive 
                      ? 'bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000000] active:translate-y-0 active:shadow-none' 
                      : 'bg-zinc-200 opacity-50 cursor-not-allowed shadow-none'}`}
                >
                  <span className="font-black text-lg uppercase tracking-widest block">{day.display}</span>
                  <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest">{day.dayOfWeek}</span>
                  {!day.isActive && <span className="block text-[9px] text-red-600 font-black uppercase mt-1">Folga</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">Horários Disponíveis</h2>
            
            {loadingSlots ? (
              <div className="font-bold text-zinc-500 uppercase tracking-widest p-4 border-4 border-dashed border-zinc-400 text-center animate-pulse">
                [ Calculando Concorrência... ]
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-black text-white p-6 border-4 border-black text-center">
                <p className="font-black uppercase tracking-widest">Nenhum horário livre.</p>
                <p className="font-bold text-sm text-zinc-400 mt-2">A agenda deste profissional está cheia para esta data.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {availableSlots.map((time) => (
                  <button 
                    key={time}
                    onClick={() => useAppointmentStore.getState().setTime(time)}
                    className="bg-white border-4 border-black py-4 font-black text-lg uppercase tracking-widest hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_#000000] active:translate-y-1 active:shadow-none transition-all"
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">Confirmação Final</h2>
            
            <div className="bg-zinc-100 border-4 border-black p-5 mb-6">
              <p className="font-bold text-sm text-zinc-500 uppercase tracking-widest mb-2 border-b-2 border-zinc-300 pb-2">Resumo da Missão:</p>
              <p className="font-black text-lg uppercase">{selectedServiceData?.name} com {selectedBarberData?.name}</p>
              <p className="font-bold text-zinc-600 uppercase mt-1">Data: {selectedDate?.split('-').reverse().join('/')}</p>
              <p className="font-bold text-zinc-600 uppercase">Horário: {selectedTime}</p>
              <p className="font-black text-xl uppercase mt-4">Total: R$ {selectedServiceData?.price}</p>
            </div>

            <div className="flex flex-col gap-4 mb-8">
              <div>
                <label className="block font-black uppercase tracking-widest text-sm mb-2">Seu Nome</label>
                <input 
                  type="text" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="DIGITE SEU NOME"
                  className="w-full bg-white border-4 border-black p-4 font-bold text-lg uppercase outline-none focus:bg-zinc-100 transition-colors placeholder:text-zinc-400 shadow-[4px_4px_0px_0px_#000000]"
                />
              </div>
              <div>
                <label className="block font-black uppercase tracking-widest text-sm mb-2">WhatsApp</label>
                <input 
                  type="tel" 
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-white border-4 border-black p-4 font-bold text-lg uppercase outline-none focus:bg-zinc-100 transition-colors placeholder:text-zinc-400 shadow-[4px_4px_0px_0px_#000000]"
                />
              </div>
            </div>

            <button 
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="w-full bg-black text-white border-4 border-black py-5 font-black text-xl uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-[6px_6px_0px_0px_#000000] active:translate-y-1 active:shadow-none transition-all"
            >
              {isSubmitting ? 'TRAVANDO SISTEMA...' : 'CONFIRMAR AGENDAMENTO'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}