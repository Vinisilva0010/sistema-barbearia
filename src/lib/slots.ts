// src/lib/slots.ts

interface SlotConfig {
  openTime: string; // ex: "09:00"
  closeTime: string; // ex: "19:00"
  slotDurationMin: number; // ex: 30
  lunchStart?: string; // ex: "12:00"
  lunchEnd?: string; // ex: "13:00"
  bookedSlots: string[]; // ex: ["14:00", "14:30"] - Virão do Firebase depois
}

export function generateAvailableSlots({
  openTime,
  closeTime,
  slotDurationMin,
  lunchStart,
  lunchEnd,
  bookedSlots
}: SlotConfig): string[] {
  const slots: string[] = [];
  
  // Converte "HH:mm" para minutos totais desde a meia-noite para facilitar o cálculo matemático
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Formata de volta de minutos para "HH:mm"
  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const startMins = timeToMinutes(openTime);
  const endMins = timeToMinutes(closeTime);
  const lunchStartMins = lunchStart ? timeToMinutes(lunchStart) : null;
  const lunchEndMins = lunchEnd ? timeToMinutes(lunchEnd) : null;

  // Loop gerando os blocos de tempo
  for (let currentMins = startMins; currentMins + slotDurationMin <= endMins; currentMins += slotDurationMin) {
    // Verifica se cai no horário de almoço
    if (lunchStartMins && lunchEndMins) {
      if (currentMins >= lunchStartMins && currentMins < lunchEndMins) {
        continue; // Pula a iteração (barbeiro almoçando)
      }
    }

    const timeString = minutesToTime(currentMins);

    // Verifica se o horário já não foi agendado no Firebase
    if (!bookedSlots.includes(timeString)) {
      slots.push(timeString);
    }
  }

  return slots;
}