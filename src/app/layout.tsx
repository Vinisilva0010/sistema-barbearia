import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, 
};

export const metadata: Metadata = {
  title: 'Bigodes Cortes | Agendamento Inteligente',
  description: 'A melhor experiência em barbearia. Cortes, barba e estilo. Agende seu horário online e sem filas.',
  keywords: 'barbearia, corte de cabelo, barba, agendamento online, são paulo, bigodes',
  manifest: '/manifest.json', 
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-icon.png', 
  },
  openGraph: {
    title: 'Bigodes Cortes',
    description: 'Agende seu corte na melhor barbearia.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#F4F4F5] text-black">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}