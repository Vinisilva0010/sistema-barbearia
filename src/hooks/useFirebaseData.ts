import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
// Tipagens rigorosas para o TypeScript não reclamar
export interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  active: boolean;
}

export interface Barber {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  active: boolean;
  lunchBreaks?: { start: string; end: string }; 
  photoUrl?: string; 
  schedule?: { day: string; active: boolean; start: string; end: string }[]; 
}

// Hook para buscar os Serviços
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const q = query(collection(db, 'services'), where('active', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Service));
    }
  });
}

// Hook para buscar os Barbeiros
export function useBarbers() {
  return useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const q = query(collection(db, 'barbers'), where('active', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Barber));
    }
  });
}

// Adicione 'addDoc' nas importações lá no topo do arquivo se não tiver, mas a collection e db já estão lá.
export function useBookedSlots(barberId: string | null, date: string | null) {
  return useQuery({
    queryKey: ['appointments', barberId, date],
    queryFn: async () => {
      if (!barberId || !date) return [];
      
      const q = query(
        collection(db, 'appointments'),
        where('barberId', '==', barberId),
        where('date', '==', date)
      );
      
      const snapshot = await getDocs(q);
      const blockedSlots: string[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'cancelled') return;

        // Se for uma Pausa Dinâmica, bloqueamos todos os minutos entre o início e o fim
        if (data.source === 'system-block' && data.endTime) {
          let current = new Date(`2000-01-01T${data.time}:00`);
          const end = new Date(`2000-01-01T${data.endTime}:00`);
          
          while (current < end) {
            const hours = String(current.getHours()).padStart(2, '0');
            const mins = String(current.getMinutes()).padStart(2, '0');
            blockedSlots.push(`${hours}:${mins}`);
            // Avança de 15 em 15 minutos fechando a agenda
            current.setMinutes(current.getMinutes() + 15);
          }
        } else {
          // Se for corte normal, bloqueia o horário de início
          blockedSlots.push(data.time as string);
        }
      });

      return blockedSlots;
    },
    enabled: !!barberId && !!date,
    retry: false,
  });
}

// Hook para buscar os agendamentos do cliente pelo telefone
export function useClientAppointments(phone: string) {
  return useQuery({
    queryKey: ['clientAppointments', phone],
    queryFn: async () => {
      if (!phone || phone.length < 10) return [];
      
      const q = query(
        collection(db, 'appointments'),
        where('phone', '==', phone)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));

      // Ordena pela data mais próxima no front-end (evita criar índice composto no Firestore)
      return data.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.time}`).getTime();
        const dateB = new Date(`${b.date}T${b.time}`).getTime();
        return dateA - dateB;
      });
    },
    enabled: phone.length >= 10,
    retry: false,
  });
}


// Hook Admin Otimizado: Busca apenas os agendamentos do mês atual para o futuro
export function useAllAppointments() {
  return useQuery({
    queryKey: ['allAppointments'],
    queryFn: async () => {
      // 1. Pega o dia 1º do mês atual
      const today = new Date();
      const firstDayOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

      // 2. Filtra direto no banco do Google (Economiza banda e RAM)
      const q = query(
        collection(db, 'appointments'),
        where('date', '>=', firstDayOfMonth) 
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    }
  });
}

// Hook Admin para buscar os Planos Mensais Ativos
export function useMonthlyPlans() {
  return useQuery({
    queryKey: ['monthlyPlans'],
    queryFn: async () => {
      const q = query(collection(db, 'monthlyPlans'), where('active', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    }
  });
}