import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  
  // A lógica brutalista: estilos base + variação de cores (preto, branco, cinza escuro)
  const baseStyles = "relative border-4 border-black font-black uppercase tracking-widest text-sm md:text-base transition-all active:translate-x-1 active:translate-y-1 active:shadow-none min-h-[48px] px-6 py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-black text-white hover:bg-zinc-800 shadow-[6px_6px_0px_0px_#000000]",
    secondary: "bg-white text-black hover:bg-zinc-100 shadow-[6px_6px_0px_0px_#000000]",
    danger: "bg-zinc-200 text-black border-dashed hover:bg-zinc-300 shadow-[6px_6px_0px_0px_#000000]" // Usando cinza com borda tracejada para ações destrutivas (ex: cancelar corte)
  };

  const widthClass = fullWidth ? "w-full" : "w-auto";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}