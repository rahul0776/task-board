import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'ghost-dark' | 'danger-ghost';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Landing-page button conventions:
// primary = accent gradient, white text, 12px radius, 14x24 padding,
//           orange shadow, -2px hover lift
// ghost   = 1px border, subtle fill
const base =
  'inline-flex items-center justify-center gap-2 font-sans font-semibold leading-none ' +
  'whitespace-nowrap cursor-pointer border border-transparent ' +
  'transition-[transform,box-shadow,background,border-color] duration-[180ms] ease-out ' +
  'motion-reduce:transition-none motion-reduce:hover:transform-none';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-grad text-white shadow-btn-accent hover:-translate-y-0.5 hover:shadow-btn-accent-lg',
  ghost:
    'border-line text-ink bg-white hover:border-[#d8cab8]',
  'ghost-dark':
    'border-dark-line text-dark-text bg-white/5 hover:bg-white/10 hover:border-[rgba(255,235,215,0.3)]',
  'danger-ghost':
    'border-line text-[#c2410c] bg-white hover:bg-[#fde8d4] hover:border-[#f5dcbd]',
};

const sizes: Record<ButtonSize, string> = {
  md: 'text-[15.5px] px-6 py-3.5 rounded-xl',
  sm: 'text-[14px] px-4 py-[9px] rounded-[10px]',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => (
  <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
    {children}
  </button>
);

export default Button;
