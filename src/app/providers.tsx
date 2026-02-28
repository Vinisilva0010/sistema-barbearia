'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Inicializamos o QueryClient dentro de um state para garantir que ele 
  // não seja recriado a cada renderização do React.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // Os dados ficam "frescos" por 5 minutos (evita requisições inúteis ao Firebase)
        refetchOnWindowFocus: false, // Não recarrega o banco só porque o usuário mudou de aba
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}