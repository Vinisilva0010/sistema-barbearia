import { create } from 'zustand';

interface AppointmentState {
  // Dados do fluxo
  step: number;
  serviceId: string | null;
  barberId: string | null;
  selectedDate: string | null; // Formato YYYY-MM-DD
  selectedTime: string | null; // Formato HH:mm
  clientData: { name: string; phone: string };

  // Ações de mutação
  setService: (id: string) => void;
  setBarber: (id: string) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setClientData: (name: string, phone: string) => void;
  
  // Controle de fluxo
  nextStep: () => void;
  prevStep: () => void;
  resetFlow: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  step: 1,
  serviceId: null,
  barberId: null,
  selectedDate: null,
  selectedTime: null,
  clientData: { name: '', phone: '' },

  setService: (id) => set({ serviceId: id, step: 2 }),
  setBarber: (id) => set({ barberId: id, step: 3 }),
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time, step: 5 }), // Pulando o step 4 direto para facilitar a UI por enquanto
  setClientData: (name, phone) => set((state) => ({ clientData: { name, phone } })),
  
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  resetFlow: () => set({ 
    step: 1, serviceId: null, barberId: null, selectedDate: null, selectedTime: null, clientData: { name: '', phone: '' } 
  }),
}));