'use client';

import { useEffect, useRef } from 'react';
import { useServices, useBarbers } from '@/hooks/useFirebaseData';
import InstallButton from '@/components/InstallButton';
export default function LandingPage() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: barbers, isLoading: loadingBarbers } = useBarbers();

  // Referências para controlar a rolagem dos carrosseis
  const barbersRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  // O Motor de Loop Automático
  useEffect(() => {
    // Rola os barbeiros (Horizontal) a cada 3.5 segundos
    const barberInterval = setInterval(() => {
      if (barbersRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = barbersRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          barbersRef.current.scrollTo({ left: 0, behavior: 'smooth' }); // Volta pro começo
        } else {
          barbersRef.current.scrollBy({ left: 320, behavior: 'smooth' }); // Avança um card
        }
      }
    }, 3500);

    // Rola os serviços (Vertical) a cada 4 segundos
    const serviceInterval = setInterval(() => {
      if (servicesRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = servicesRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          servicesRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          servicesRef.current.scrollBy({ top: 180, behavior: 'smooth' });
        }
      }
    }, 4000);

    return () => {
      clearInterval(barberInterval);
      clearInterval(serviceInterval);
    };
  }, []);

  // O Cérebro SEO (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: 'Bigodes Cortes',
    image: '/icons/logo-bigo.png', 
    telephone: '+5511999999999',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua da Engenharia, 404',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR'
    },
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '20:00'
      }
    ]
  };

  return (
    <div className="p-6 flex flex-col gap-12 max-w-md md:max-w-4xl mx-auto pb-32 animate-in fade-in duration-500">
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 1. HERO SECTION BRUTALISTA */}
      <section className="mt-4 text-center md:text-left">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4 bg-yellow-400 inline-block px-4 py-2 border-4 border-black shadow-[8px_8px_0px_0px_#000000] -rotate-2">
          Bigodes <br />
          <span className="text-white text-5xl md:text-7xl bg-black px-2 mt-2 block shadow-none -rotate-2">Cortes.</span>
        </h1>
        <p className="font-bold text-xl text-zinc-700 leading-relaxed border-l-8 border-black pl-4 mt-6 bg-white p-4 shadow-[6px_6px_0px_0px_#A1A1AA]">
          A melhor barbearia de são Mateus, onde tradição e estilo se encontram.
        </p>
      </section>

    {/* BOTÃO DE INSTALAÇÃO DO PWA */}
      <InstallButton />

      {/* 2. O ESPELHO DO BALCÃO COM VÍDEO ANTI-LAG */}
      <section className="relative w-full max-w-2xl mx-auto mt-4 group">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-center">Nosso trabalho</h2>
        
        <div className="aspect-4/3 md:aspect-video border-8 border-zinc-300 rounded-t-[40%] bg-zinc-900 border-b-0 shadow-[8px_8px_0px_0px_#000000] overflow-hidden relative z-10 transition-transform group-hover:scale-[1.02]">
          
          {/* O VÍDEO REAL RODANDO LISO */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-90 mix-blend-normal md:mix-blend-luminosity md:hover:mix-blend-normal transition-all duration-700"
            src="/bigodes.mp4" 
          />

        </div>
        
        <div className="h-10 md:h-16 bg-amber-700 border-4 border-black shadow-[8px_8px_0px_0px_#000000] relative z-20 w-[105%] -ml-[2.5%] flex items-center justify-center">
          <div className="w-1/3 h-2 bg-black opacity-20 rounded-full"></div>
        </div>
      </section>

      {/* 3. CARROSSEL HORIZONTAL DE BARBEIROS (AUTOMÁTICO) */}
      <section className="w-full">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 border-b-4 border-black pb-2">Barbeiros</h2>
        
       {loadingBarbers ? (
          <div className="flex overflow-hidden gap-6 pb-8 pt-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-65 md:min-w-75 bg-zinc-200 border-4 border-black shadow-[6px_6px_0px_0px_#A1A1AA] flex flex-col shrink-0 animate-pulse">
                <div className="w-full h-48 bg-zinc-300 border-b-4 border-black"></div>
                <div className="p-4 bg-zinc-100">
                  <div className="h-8 bg-zinc-300 w-3/4 mb-2"></div>
                  <div className="h-4 bg-zinc-300 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            ref={barbersRef} // Conectando o motor de loop
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 pt-2 px-2 hide-scrollbar scroll-smooth"
          >
            {barbers?.filter(b => b.active).map(barber => (
              <div key={barber.id} className="w-64 md:w-72 shrink-0 snap-center bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000000] flex flex-col overflow-hidden">
                {barber.photoUrl ? (
                  <img src={barber.photoUrl} alt={barber.name} className="w-full h-48 object-cover border-b-4 border-black grayscale hover:grayscale-0 transition-all" />
                ) : (
                  <div className="w-full h-48 bg-zinc-200 border-b-4 border-black flex items-center justify-center font-black text-2xl text-zinc-400">SEM FOTO</div>
                )}
                <div className="p-4 bg-yellow-400">
                  <h3 className="font-black text-2xl uppercase tracking-tight truncate">{barber.name}</h3>
                  <p className="font-bold text-black text-sm uppercase">{barber.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. LISTA VERTICAL DE SERVIÇOS (AUTOMÁTICA) */}
      <section>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 border-b-4 border-black pb-2"> Serviços</h2>
        
       {loadingServices ? (
          <div className="flex flex-col gap-6 p-4 border-4 border-black bg-zinc-100 shadow-inner">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-h-40 bg-zinc-200 border-4 border-black p-6 flex flex-col justify-end shadow-[4px_4px_0px_0px_#A1A1AA] animate-pulse">
                <div className="h-8 bg-zinc-300 w-1/2 mb-2"></div>
                <div className="h-4 bg-zinc-300 w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            ref={servicesRef} // Conectando o motor de loop
            className="flex flex-col overflow-y-auto max-h-125 snap-y snap-mandatory gap-6 p-4 border-4 border-black bg-zinc-100 shadow-inner scroll-smooth hide-scrollbar"
          >
            {services?.filter(s => s.active).map(service => (
              <div key={service.id} className="max-h-125 snap-start bg-white border-4 border-black p-6 flex flex-col justify-end shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group cursor-pointer hover:bg-black hover:text-white transition-colors active:scale-95">
                
                <span className="absolute -right-4 -top-8 text-8xl font-black text-zinc-100 group-hover:text-zinc-800 transition-colors pointer-events-none select-none">
                  {service.durationMin}'
                </span>

                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tight mb-1">{service.name}</h3>
                    <p className="font-bold text-sm uppercase opacity-70">Execução: {service.durationMin} Minutos</p>
                  </div>
                  <div className="bg-black group-hover:bg-white text-white group-hover:text-black font-black text-xl px-4 py-2 border-4 border-black transition-colors">
                    R$ {service.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. FOOTER / QG CENTRAL */}
      <section className="bg-black text-white border-4 border-black p-6 md:p-10 shadow-[8px_8px_0px_0px_#A1A1AA] mt-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 border-b-4 border-zinc-700 pb-4">Bigosdes</h2>
        
        <ul className="space-y-4 font-bold text-zinc-300 text-lg mb-8">
          <li className="flex justify-between border-b-2 border-zinc-800 pb-2"><span>Domingo a  Domingo</span>  </li>
          
          <li className="flex flex-col mt-4 pt-4 text-white">
            <span className="text-zinc-500 text-sm uppercase mb-1">Localização</span>
            <span className="text-xl">AV riacho dos machados, 1065  - ZL SP</span>
          </li>
        </ul>

        <a 
          href="https://wa.me/5511999999999?text=Fala%20Bigodes!%20Vim%20pelo%20site." 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full block bg-green-500 text-black text-center py-5 font-black text-xl uppercase tracking-widest border-4 border-black hover:bg-green-400 transition-colors shadow-[6px_6px_0px_0px_#FFFFFF] active:translate-y-1 active:shadow-none"
        >
          [ CHAMA NO ZAP ]
        </a>
      </section>

    </div>
  );
}