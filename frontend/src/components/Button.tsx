import React from 'react';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Size = 'md' | 'sm';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean;
}

export default function Button({ variant = 'secondary', size = 'md', active = false, className = '', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-lg transition duration-150 ease-out';
  const sizes = size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs';
  const variants: Record<Variant, string> = {
    primary: 'bg-[#1e2a38] border border-[#2b3a4a] hover:bg-[#243345] hover:border-[#344558] text-white',
    secondary: 'bg-transparent border border-[#2b2f33] hover:bg-[#111317] text-white',
    destructive: 'bg-[#3a1e22] border border-[#4a2b31] hover:bg-[#452326] text-white',
    ghost: 'bg-transparent text-white hover:bg-[#0d0f12]'
  };
  const activeStyle = active ? 'bg-[#161b22] border border-[#2b2f33] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]' : '';
  return <button className={[base, sizes, variants[variant], activeStyle, className].join(' ')} {...props} />;
}
