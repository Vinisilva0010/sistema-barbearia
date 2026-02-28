'use client';

import { useEffect, useState } from 'react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Checa se já está em tela cheia (App instalado)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    const userAgent = navigator.userAgent;

    // 2. Radar de iPhone/iPad
    const isIosDevice = /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Mac") && "ontouchend" in document);
    setIsIOS(isIosDevice);

    // 3. Radar de Android
    const isAndroidDevice = /android/i.test(userAgent);
    setIsAndroid(isAndroidDevice);

    // 4. Tenta capturar o pop-up nativo do Chrome (Se o Google permitir)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Cenário Ouro: Chrome liberou o pop-up mágico
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // Cenário Prata (iPhone): Instrução tática
      alert('Para instalar no iPhone:\n\n1. Toque no ícone de Compartilhar (o quadrado com uma seta pra cima, no menu inferior).\n2. Role para baixo e escolha "Adicionar à Tela de Início".');
    } else if (isAndroid) {
      // Cenário Bronze (Android blindado): Instrução tática
      alert('Para instalar no Android:\n\n1. Toque nos 3 pontinhos (Menu) no canto superior direito do navegador.\n2. Escolha "Adicionar à tela inicial" ou "Instalar aplicativo".');
    } else {
      // Cenário PC
      alert('Acesse este site pelo celular para instalar o App da Barbearia!');
    }
  };

  // Esconde o botão se o cara já abriu pelo App instalado
  if (isStandalone) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="w-full bg-black text-white mt-8 py-5 font-black text-xl md:text-2xl uppercase tracking-widest border-4 border-black hover:bg-zinc-800 transition-all shadow-[6px_6px_0px_0px_#A1A1AA] active:translate-y-1 active:shadow-none animate-bounce"
    >
      [ BAIXAR APLICATIVO ]
    </button>
  );
}