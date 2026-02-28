'use client';

import { useEffect, useState } from 'react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Checa se o cara JÁ instalou o app (se sim, esconde o botão)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // 2. Checa se é iPhone/iPad
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);

    // 3. Captura o pop-up nativo do Android (Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // É Android: Abre a caixa nativa de instalar
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null); // Esconde o botão se ele aceitou
      }
    } else if (isIOS) {
      // É iPhone: Mostra o aviso com as instruções
      alert('Para instalar no iPhone:\n\n1. Toque no ícone de Compartilhar (o quadrado com uma seta pra cima, no menu inferior).\n2. Role para baixo e escolha "Adicionar à Tela de Início".');
    } else {
      // Computador / Navegador genérico
      alert('Acesse este site pelo celular para instalar o App da Barbearia!');
    }
  };

  // Se o app já tá instalado e rodando em tela cheia, o botão some
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