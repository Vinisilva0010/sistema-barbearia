'use client';

import { useState } from 'react';
import { useServices, useBarbers } from '@/hooks/useFirebaseData';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
// 1. NOVAS IMPORTAÇÕES DE SEGURANÇA E AUTH
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from 'firebase/auth';
import { db, storage, auth } from '@/lib/firebase'; 

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'barbers' | 'system'>('services');
  const [editingScheduleBarber, setEditingScheduleBarber] = useState<any | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  
  const handleOpenScheduleEditor = (barber: any) => {
    setSchedule(barber.schedule || defaultSchedule);
    setEditingScheduleBarber(barber);
  };

  const handleSaveSchedule = async () => {
    if (!editingScheduleBarber) return;
    setIsSavingSchedule(true);
    try {
      await updateDoc(doc(db, 'barbers', editingScheduleBarber.id), { schedule });
      setEditingScheduleBarber(null);
      refetchBarbers();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // ==========================================
  // MÓDULO 1: GESTÃO DE SERVIÇOS
  // ==========================================
  const { data: services, isLoading: loadingServices, refetch: refetchServices } = useServices();
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice || !newServiceDuration) return;
    setIsSubmittingService(true);
    try {
      await addDoc(collection(db, 'services'), {
        name: newServiceName.toUpperCase(),
        price: Number(newServicePrice),
        durationMin: Number(newServiceDuration),
        active: true
      });
      setNewServiceName(''); setNewServicePrice(''); setNewServiceDuration('30');
      refetchServices();
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleToggleService = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'services', id), { active: !currentStatus });
    refetchServices();
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Excluir este serviço?')) return;
    await deleteDoc(doc(db, 'services', id));
    refetchServices();
  };

  // ==========================================
  // MÓDULO 2: GESTÃO DE OPERADORES
  // ==========================================
  const { data: barbers, isLoading: loadingBarbers, refetch: refetchBarbers } = useBarbers();
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberSpecialty, setNewBarberSpecialty] = useState('');
  const [newBarberPhone, setNewBarberPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmittingBarber, setIsSubmittingBarber] = useState(false);

  const defaultSchedule = [
    { day: 'Domingo', active: false, start: '09:00', end: '13:00' },
    { day: 'Segunda', active: true, start: '09:00', end: '19:00' },
    { day: 'Terça', active: true, start: '09:00', end: '19:00' },
    { day: 'Quarta', active: true, start: '09:00', end: '19:00' },
    { day: 'Quinta', active: true, start: '09:00', end: '19:00' },
    { day: 'Sexta', active: true, start: '09:00', end: '20:00' },
    { day: 'Sábado', active: true, start: '09:00', end: '18:00' },
  ];
  const [schedule, setSchedule] = useState(defaultSchedule);

  const updateSchedule = (index: number, field: string, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName || !newBarberSpecialty) return;
    setIsSubmittingBarber(true);
    
    try {
      let finalPhotoUrl = '';
      if (photoFile) {
        const storageRef = ref(storage, `barbers/${Date.now()}_${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        finalPhotoUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'barbers'), {
        name: newBarberName.toUpperCase(),
        specialty: newBarberSpecialty.toUpperCase(),
        phone: newBarberPhone,
        photoUrl: finalPhotoUrl, 
        active: true,
        schedule: schedule 
      });

      setNewBarberName(''); 
      setNewBarberSpecialty(''); 
      setNewBarberPhone(''); 
      setPhotoFile(null); 
      setSchedule(defaultSchedule);
      refetchBarbers();
    } catch (error) {
      console.error('Erro na operação:', error);
      alert('Falha ao subir a imagem ou cadastrar perfil.');
    } finally {
      setIsSubmittingBarber(false);
    }
  };

  const handleToggleBarber = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'barbers', id), { active: !currentStatus });
    refetchBarbers();
  };

  const handleDeleteBarber = async (id: string) => {
    if (!window.confirm('Demitir este operador? A agenda dele sumirá.')) return;
    await deleteDoc(doc(db, 'barbers', id));
    refetchBarbers();
  };

  // ==========================================
  // MÓDULO 3: SISTEMA (ZONA DE PERIGO E SENHA)
  // ==========================================
  const [wipeConfirmation, setWipeConfirmation] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  
  // ESTADOS DA PORTA DE AÇO
  const [isDangerZoneUnlocked, setIsDangerZoneUnlocked] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // FUNÇÃO: REAUTENTICAR (DESTRAVAR O COFRE)
  const handleUnlockDangerZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;

    setIsAuthenticating(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, authPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setIsDangerZoneUnlocked(true); // Abre as portas
      setAuthPassword(''); // Limpa a senha por segurança
    } catch (error) {
      console.error(error);
      alert('ACESSO NEGADO: Senha Incorreta ou Falha de Comunicação.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // FUNÇÃO: ALTERAR SENHA E DESLOGAR
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (newPassword.length < 6) {
      alert('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!window.confirm('Ao trocar a senha, todos os aparelhos logados serão desconectados. Prosseguir?')) return;

    setIsChangingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      alert('SENHA ALTERADA COM SUCESSO! O sistema fará o logout por segurança.');
      await signOut(auth);
      window.location.href = '/login'; // Chuta o usuário pra fora
    } catch (error) {
      console.error(error);
      alert('Erro ao alterar a senha. Tente novamente.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // FUNÇÃO: OBLITERAR DADOS
  const handleWipeData = async () => {
    if (wipeConfirmation !== 'apagar') {
      alert('Frase de segurança incorreta. Abortando operação.');
      return;
    }
    if (!window.confirm('ALERTA MÁXIMO: Isso apagará TODOS os agendamentos, barbeiros, serviços e planos. Essa ação é IRREVERSÍVEL. Confirmar obliteração?')) return;

    setIsWiping(true);
    try {
      const collectionsToWipe = ['appointments', 'barbers', 'services', 'monthlyPlans'];

      for (const colName of collectionsToWipe) {
        const snapshot = await getDocs(collection(db, colName));
        const batches = [];
        let currentBatch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach((document) => {
          currentBatch.delete(doc(db, colName, document.id));
          count++;
          if (count === 490) { 
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            count = 0;
          }
        });
        batches.push(currentBatch);

        for (const b of batches) {
          await b.commit();
        }
      }

      alert('SISTEMA RESETADO. A base de dados foi obliterada com sucesso.');
      setWipeConfirmation('');
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert('Erro crítico ao tentar apagar os dados.');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      
      <div className="border-b-4 border-black pb-4 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Motor Central</h1>
        <p className="font-bold text-zinc-500 uppercase tracking-widest mt-1">Configurações do Sistema</p>
      </div>

      <div className="flex bg-zinc-100 border-4 border-black p-1 overflow-x-auto">
        <button onClick={() => setActiveTab('services')} className={`flex-1 min-w-30 py-3 font-black text-xs sm:text-sm uppercase tracking-widest transition-colors ${activeTab === 'services' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}>Serviços</button>
        <button onClick={() => setActiveTab('barbers')} className={`flex-1 min-w-30 py-3 font-black text-xs sm:text-sm uppercase tracking-widest transition-colors ${activeTab === 'barbers' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}>Barbeiros</button>
        <button onClick={() => setActiveTab('system')} className={`flex-1 min-w-30 py-3 font-black text-xs sm:text-sm uppercase tracking-widest transition-colors ${activeTab === 'system' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}>Sistema / Segurança</button>
      </div>

      {/* ABA 1: SERVIÇOS (Inalterada) */}
      {activeTab === 'services' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <form onSubmit={handleAddService} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-4">
            <h2 className="font-black uppercase tracking-widest border-l-4 border-black pl-2 mb-2">Adicionar Novo Corte/Serviço</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-black uppercase tracking-widest text-xs mb-1">Nome do Serviço</label>
                <input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="EX: PLATINADO" className="w-full bg-zinc-50 border-4 border-black p-3 font-bold uppercase outline-none focus:bg-zinc-200" required />
              </div>
              <div>
                <label className="block font-black uppercase tracking-widest text-xs mb-1">Valor (R$)</label>
                <input type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} placeholder="0.00" className="w-full bg-zinc-50 border-4 border-black p-3 font-bold uppercase outline-none focus:bg-zinc-200" required />
              </div>
              <div>
                <label className="block font-black uppercase tracking-widest text-xs mb-1">Duração (Min)</label>
                <select value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} className="w-full bg-zinc-50 border-4 border-black p-3 font-bold uppercase outline-none rounded-none cursor-pointer">
                  <option value="15">15 Minutos</option>
                  <option value="30">30 Minutos</option>
                  <option value="45">45 Minutos</option>
                  <option value="60">1 Hora</option>
                  <option value="90">1 Hora e 30 Min</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={isSubmittingService} className="w-full mt-2 bg-black text-white py-4 font-black text-sm uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors border-4 border-black">
              {isSubmittingService ? 'INJETANDO...' : '[ + ] CADASTRAR SERVIÇO'}
            </button>
          </form>

          <div className="flex flex-col gap-4">
            {loadingServices ? (
              <div className="border-4 border-black p-6 text-center font-black animate-pulse">CARREGANDO...</div>
            ) : (
              services?.map(service => (
                <div key={service.id} className={`flex flex-col md:flex-row justify-between items-start md:items-center bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000000] ${!service.active ? 'opacity-60 bg-zinc-200 border-dashed' : ''}`}>
                  <div className="mb-4 md:mb-0">
                    <p className="font-black text-lg uppercase">{service.name}</p>
                    <p className="font-bold text-xs text-zinc-600 uppercase tracking-widest">R$ {service.price} • {service.durationMin} Min</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => handleToggleService(service.id, service.active)} className={`flex-1 md:flex-none px-4 py-2 font-black text-xs uppercase tracking-widest border-4 border-black transition-colors ${service.active ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}>
                      {service.active ? 'DESATIVAR' : 'ATIVAR'}
                    </button>
                    <button onClick={() => handleDeleteService(service.id)} className="px-4 py-2 bg-white text-red-600 border-4 border-black font-black text-xs uppercase hover:bg-red-50 transition-colors">X</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 2: OPERADORES (Inalterada) */}
      {activeTab === 'barbers' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative">
          
          {editingScheduleBarber && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black p-6 w-full max-w-lg shadow-[8px_8px_0px_0px_#A1A1AA] max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 border-b-4 border-black pb-2">
                  Jornada: {editingScheduleBarber.name}
                </h3>
                <p className="font-bold text-zinc-600 mb-6 text-sm uppercase">Edite os dias de abertura e fechamento deste operador.</p>
                
                <div className="flex flex-col gap-3 mb-6">
                  {schedule.map((day, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 border-2 border-black transition-colors ${day.active ? 'bg-white' : 'bg-zinc-200 opacity-60'}`}>
                      <div className="w-24">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={day.active} onChange={(e) => updateSchedule(index, 'active', e.target.checked)} className="w-5 h-5 border-2 border-black accent-black cursor-pointer" />
                          <span className="font-black text-xs uppercase tracking-widest">{day.day}</span>
                        </label>
                      </div>
                      <div className="flex-1 flex gap-2 items-center">
                        <input type="time" value={day.start} disabled={!day.active} onChange={(e) => updateSchedule(index, 'start', e.target.value)} className="w-full bg-zinc-50 border-2 border-black p-2 font-bold text-xs uppercase outline-none disabled:bg-transparent" />
                        <span className="font-black text-xs">ATÉ</span>
                        <input type="time" value={day.end} disabled={!day.active} onChange={(e) => updateSchedule(index, 'end', e.target.value)} className="w-full bg-zinc-50 border-2 border-black p-2 font-bold text-xs uppercase outline-none disabled:bg-transparent" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button onClick={handleSaveSchedule} disabled={isSavingSchedule} className="flex-1 bg-black text-white py-4 font-black text-sm uppercase tracking-widest border-4 border-black hover:bg-zinc-800 disabled:opacity-50">
                    {isSavingSchedule ? 'SALVANDO...' : 'ATUALIZAR JORNADA'}
                  </button>
                  <button onClick={() => setEditingScheduleBarber(null)} className="py-4 px-6 font-bold text-sm text-zinc-500 uppercase tracking-widest hover:text-black border-4 border-transparent">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAddBarber} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-4">
            <h2 className="font-black uppercase tracking-widest border-l-4 border-black pl-2 mb-2">Homologar Novo Operador</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-black uppercase tracking-widest text-xs mb-1">Nome do Barbeiro *</label>
                <input type="text" value={newBarberName} onChange={(e) => setNewBarberName(e.target.value)} placeholder="EX: MARCOS" className="w-full bg-zinc-50 border-4 border-black p-3 font-bold uppercase outline-none focus:bg-zinc-200" required />
              </div>
              <div>
                <label className="block font-black uppercase tracking-widest text-xs mb-1">Especialidade *</label>
                <input type="text" value={newBarberSpecialty} onChange={(e) => setNewBarberSpecialty(e.target.value)} placeholder="EX: BARBa & cabelo" className="w-full bg-zinc-50 border-4 border-black p-3 font-bold uppercase outline-none focus:bg-zinc-200" required />
              </div>
              <div>
                <label className="block font-black uppercase tracking-widest text-xs mb-1">WhatsApp</label>
                <input type="tel" value={newBarberPhone} onChange={(e) => setNewBarberPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-zinc-50 border-4 border-black p-3 font-bold uppercase outline-none focus:bg-zinc-200" />
              </div>
              <div>
                <label className="block font-black uppercase tracking-widest text-xs mb-1">Foto de Perfil (Opcional)</label>
                <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) { setPhotoFile(e.target.files[0]); } }} className="w-full bg-zinc-50 border-4 border-black p-2 font-bold text-xs uppercase outline-none focus:bg-zinc-200 cursor-pointer file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-black file:text-white file:font-black file:uppercase file:text-xs hover:file:bg-zinc-800 transition-all" />
              </div>
            </div>
            <button type="submit" disabled={isSubmittingBarber} className="w-full mt-2 bg-black text-white py-4 font-black text-sm uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors border-4 border-black">
              {isSubmittingBarber ? 'CADASTRANDO...' : '[ + ] CADASTRAR PERFIL'}
            </button>
          </form>

          <div className="flex flex-col gap-4">
            {loadingBarbers ? (
              <div className="border-4 border-black p-6 text-center font-black animate-pulse">CARREGANDO...</div>
            ) : (
              barbers?.map(barber => (
                <div key={barber.id} className={`flex flex-col bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000000] ${!barber.active ? 'opacity-60 bg-zinc-200 border-dashed' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-center">
                      {barber.photoUrl ? (
                        <img src={barber.photoUrl} alt="Foto" className="w-16 h-16 border-2 border-black object-cover" />
                      ) : (
                        <div className="w-16 h-16 border-2 border-black bg-zinc-200 flex items-center justify-center font-black text-xs">FOTO</div>
                      )}
                      <div>
                        <p className="font-black text-xl uppercase">{barber.name}</p>
                        <p className="font-bold text-xs text-zinc-600 uppercase tracking-widest">{barber.specialty}</p>
                        <p className="font-bold text-xs text-zinc-600 uppercase tracking-widest mt-1">Tel: {barber.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 w-full pt-4 border-t-2 border-dashed border-zinc-300">
                    <button onClick={() => handleOpenScheduleEditor(barber)} className="flex-1 px-4 py-3 bg-zinc-100 text-black border-4 border-black font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                      [ EDITAR JORNADA ]
                    </button>
                    <button onClick={() => handleToggleBarber(barber.id, barber.active)} className={`flex-1 px-4 py-3 font-black text-xs uppercase tracking-widest border-4 border-black transition-colors ${barber.active ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}>
                      {barber.active ? 'DESATIVAR' : 'ATIVAR'}
                    </button>
                    <button onClick={() => handleDeleteBarber(barber.id)} className="px-4 py-3 bg-white text-red-600 border-4 border-black font-black text-xs uppercase hover:bg-red-50 transition-colors">
                      EXCLUIR PERFIL
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 3: SISTEMA (ZONA DE PERIGO E SEGURANÇA BLINDADA) */}
      {activeTab === 'system' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          
          {/* SE A PORTA DE AÇO ESTIVER TRANCADA */}
          {!isDangerZoneUnlocked ? (
            <form onSubmit={handleUnlockDangerZone} className="bg-zinc-900 border-4 border-black p-6 md:p-10 shadow-[8px_8px_0px_0px_#000000] text-center">
              <div className="w-20 h-20 mx-auto bg-black border-4 border-yellow-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                <span className="text-yellow-400 text-4xl">🔒</span>
              </div>
              <h2 className="text-3xl font-black uppercase text-white mb-2 tracking-tighter">Acesso Restrito</h2>
              <p className="font-bold text-zinc-400 uppercase tracking-widest mb-8 text-sm">
                Digite a senha atual para acessar as configurações críticas de segurança e banco de dados.
              </p>
              
              <div className="max-w-xs mx-auto flex flex-col gap-4">
                <input 
                  type="password" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="SUA SENHA ATUAL"
                  className="w-full bg-zinc-800 text-white border-4 border-black p-4 font-black uppercase text-center outline-none focus:border-yellow-400 transition-colors placeholder:text-zinc-600"
                  required
                />
                <button 
                  type="submit"
                  disabled={isAuthenticating || !authPassword}
                  className="w-full bg-yellow-400 text-black py-4 font-black text-lg uppercase tracking-widest border-4 border-black hover:bg-yellow-500 disabled:opacity-50 active:translate-y-1 transition-all"
                >
                  {isAuthenticating ? 'VERIFICANDO...' : 'DESTRAVAR COFRE'}
                </button>
              </div>
            </form>
          ) : (
            
            /* SE A PORTA DE AÇO ESTIVER DESTRAVADA, MOSTRA AS DUAS CAIXAS (SENHA E DELETAR DADOS) */
            <div className="flex flex-col gap-8 animate-in zoom-in-95 duration-300">
              
              {/* CAIXA 1: TROCAR SENHA */}
              <form onSubmit={handleChangePassword} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000000]">
                <h2 className="font-black text-2xl uppercase tracking-tighter mb-2 border-b-4 border-black pb-2">Alterar Chave de Acesso</h2>
                <p className="font-bold text-xs text-zinc-600 uppercase tracking-widest mb-6">Mantenha sua conta segura alterando a senha periodicamente.</p>
                
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block font-black uppercase tracking-widest text-xs mb-1">Nova Senha Mestra (Mín. 6 caracteres)</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="DIGITE A NOVA SENHA" 
                      className="w-full bg-zinc-50 border-4 border-black p-4 font-black uppercase outline-none focus:bg-zinc-200 transition-colors"
                      required
                      minLength={6}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isChangingPassword || newPassword.length < 6}
                    className="w-full md:w-auto bg-black text-white px-8 py-4 font-black text-sm uppercase tracking-widest border-4 border-black hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {isChangingPassword ? 'ATUALIZANDO...' : 'TROCAR SENHA E SAIR'}
                  </button>
                </div>
              </form>

              {/* CAIXA 2: OBLITERAÇÃO DE DADOS (ZONA DE PERIGO) */}
              <div className="bg-red-50 border-4 border-red-600 p-6 md:p-8 shadow-[6px_6px_0px_0px_#DC2626]">
                <div className="flex items-center gap-4 mb-4 border-b-4 border-red-600 pb-4">
                  <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center font-black text-2xl">!</div>
                  <div>
                    <h2 className="font-black text-2xl md:text-3xl uppercase tracking-tighter text-red-600">Zona de Perigo</h2>
                    <p className="font-bold text-xs md:text-sm text-red-800 uppercase tracking-widest">Reset de Fábrica / Obliteração de Dados</p>
                  </div>
                </div>

                <p className="font-bold text-sm text-red-700 uppercase mb-6 leading-relaxed">
                  Esta ação vai apagar permanentemente todas as tabelas do sistema: 
                  <br/><br/>
                  • Operadores<br/>
                  • Serviços<br/>
                  • Agendamentos<br/>
                  • Planos Mensais
                  <br/><br/>
                  digite a frase de segurança abaixo.
                </p>

                <div className="bg-white border-4 border-red-600 p-4 mb-6">
                  <label className="block font-black uppercase tracking-widest text-xs mb-2 text-red-600">
                    Digite exatamente: <span className="text-black bg-zinc-200 px-2 py-1 select-all">apagar</span>
                  </label>
                  <input 
                    type="text" 
                    value={wipeConfirmation}
                    onChange={(e) => setWipeConfirmation(e.target.value)}
                    placeholder="DIGITE A FRASE AQUI" 
                    className="w-full bg-zinc-50 border-4 border-black p-4 font-black uppercase text-center outline-none focus:bg-red-100 transition-colors"
                  />
                </div>

                <button 
                  onClick={handleWipeData}
                  disabled={isWiping || wipeConfirmation !== 'apagar'}
                  className="w-full bg-red-600 text-white py-5 font-black text-lg md:text-xl uppercase tracking-widest border-4 border-black hover:bg-red-700 disabled:opacity-50 disabled:bg-zinc-400 disabled:border-zinc-500 transition-all shadow-[4px_4px_0px_0px_#000000] active:translate-y-1 active:shadow-none"
                >
                  {isWiping ? 'OBLITERANDO BANCO DE DADOS...' : 'DELETAR TUDO E RESETAR SISTEMA'}
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}