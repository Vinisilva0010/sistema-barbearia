'use client';

import { useState, useMemo } from 'react';
import { useAllAppointments, useServices } from '@/hooks/useFirebaseData';

export default function ClientesPage() {
  const { data: appointments, isLoading: loadingApts } = useAllAppointments();
  const { data: services, isLoading: loadingServices } = useServices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // MOTOR DE DADOS: Agrupa os agendamentos por cliente na memória RAM
  const clientsData = useMemo(() => {
    if (!appointments || !services) return [];

    const map = new Map();

    appointments.forEach((apt: any) => {
      // Usa o telefone como ID. Se não tiver (avulso), usa o nome em minúsculo.
      const clientId = apt.phone !== 'N/A' ? apt.phone : `avulso-${apt.clientName.toLowerCase()}`;
      
      if (!map.has(clientId)) {
        map.set(clientId, {
          id: clientId,
          name: apt.clientName,
          phone: apt.phone,
          totalSpent: 0,
          totalVisits: 0,
          cancelled: 0,
          history: []
        });
      }

      const client = map.get(clientId);
      client.history.push(apt);

      // Soma o financeiro apenas se o corte foi concluído
      if (apt.status === 'done') {
        client.totalVisits += 1;
        const service = services.find(s => s.id === apt.serviceId);
        if (service) {
          client.totalSpent += service.price;
        }
      } else if (apt.status === 'cancelled') {
        client.cancelled += 1;
      }
    });

    // Converte o Map para Array e ordena pelos clientes que mais gastaram (Os VIPs primeiro)
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [appointments, services]);

  // Filtro de Busca
  const filteredClients = clientsData.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  if (loadingApts || loadingServices) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-black text-xl uppercase tracking-widest animate-pulse border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_#000000]">
          [ Processando Matriz de Clientes... ]
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* MODAL DO RAIO-X DO CLIENTE */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-lg shadow-[8px_8px_0px_0px_#A1A1AA] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">{selectedClient.name}</h3>
                <p className="font-bold text-zinc-500 tracking-widest uppercase">{selectedClient.phone}</p>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="bg-black text-white px-3 py-1 font-black text-xl hover:bg-zinc-800 transition-colors"
              >
                X
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-100 border-4 border-black p-4 text-center">
                <p className="font-bold text-xs uppercase text-zinc-500 mb-1">LTV (Valor Vitalício)</p>
                <p className="font-black text-xl uppercase">R$ {selectedClient.totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-zinc-100 border-4 border-black p-4 text-center">
                <p className="font-bold text-xs uppercase text-zinc-500 mb-1">Faltas / Cancelados</p>
                <p className="font-black text-xl uppercase text-black">{selectedClient.cancelled}</p>
              </div>
            </div>

            <h4 className="font-black uppercase tracking-widest border-l-4 border-black pl-2 mb-4">Histórico de Operações</h4>
            <div className="flex flex-col gap-3">
              {selectedClient.history.map((apt: any) => (
                <div key={apt.id} className="border-2 border-black p-3 flex justify-between items-center bg-zinc-50">
                  <div>
                    <p className="font-black uppercase text-sm">{apt.serviceName}</p>
                    <p className="font-bold text-xs text-zinc-500 uppercase">{apt.date.split('-').reverse().join('/')} com {apt.barberName}</p>
                  </div>
                  <div>
                    {apt.status === 'done' && <span className="bg-black text-white px-2 py-1 text-xs font-black uppercase">Concluído</span>}
                    {apt.status === 'cancelled' && <span className="bg-zinc-300 text-black px-2 py-1 text-xs font-black uppercase">Cancelado</span>}
                    {apt.status === 'pending' && <span className="bg-white border-2 border-black px-2 py-1 text-xs font-black uppercase">Pendente</span>}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* CABEÇALHO DA TELA */}
      <div className="border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Base de Clientes</h1>
          <p className="font-bold text-zinc-500 uppercase tracking-widest mt-1">Inteligência e Retenção</p>
        </div>
        <div className="bg-black text-white px-4 py-2 font-black uppercase tracking-widest border-4 border-black">
          Total: {filteredClients.length}
        </div>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000000]">
        <label className="block font-black uppercase tracking-widest text-xs mb-1 text-zinc-500">Localizar Cliente</label>
        <input 
          type="text" 
          placeholder="Nome ou Telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-100 border-4 border-black p-3 font-bold uppercase outline-none focus:bg-white transition-colors placeholder:text-zinc-400"
        />
      </div>

      {/* LISTAGEM DE CLIENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="flex flex-col border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] transition-all">
            
            <div className="p-5 flex-1">
              <h2 className="font-black text-xl uppercase truncate mb-1">{client.name}</h2>
              <p className="font-bold text-xs text-zinc-500 uppercase tracking-widest mb-4">
                {client.phone}
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-zinc-100 p-2 border-2 border-black text-center">
                  <p className="font-bold text-[10px] text-zinc-500 uppercase">Cortes</p>
                  <p className="font-black text-lg">{client.totalVisits}</p>
                </div>
                <div className="bg-zinc-100 p-2 border-2 border-black text-center">
                  <p className="font-bold text-[10px] text-zinc-500 uppercase">Gasto Total</p>
                  <p className="font-black text-lg">R$ {client.totalSpent}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedClient(client)}
              className="w-full bg-black text-white py-4 font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors border-t-4 border-black"
            >
              [ Ver Raio-X ]
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}