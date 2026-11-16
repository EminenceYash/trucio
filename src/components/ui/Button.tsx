import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0891B2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC] disabled:opacity-45 disabled:pointer-events-none cursor-pointer';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-[#0F172A] text-white hover:bg-[#1E293B] active:scale-[0.98] shadow-[0_10px_24px_-12px_rgba(15,23,42,0.45)]',
    secondary:
      'bg-white text-[#0F172A] border border-slate-200 hover:border-[#0891B2]/50 hover:bg-slate-50 active:scale-[0.98] shadow-2xs',
    ghost:
      'bg-transparent text-slate-600 hover:text-[#0F172A] hover:bg-slate-900/[0.04]',
    danger:
      'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-1.5 text-xs min-h-[34px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-5 py-2.5 text-sm min-h-[44px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
