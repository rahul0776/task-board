import React from 'react';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  dark?: boolean;
}

// Landing-page chip: JetBrains Mono, 8px radius, hairline border.
const Chip: React.FC<ChipProps> = ({ dark = false, className = '', children, ...rest }) => (
  <span
    className={
      'font-mono text-[12.5px] rounded-lg px-[11px] py-1.5 border ' +
      (dark
        ? 'text-dark-muted border-dark-line bg-white/[0.03] '
        : 'text-ink-soft border-line bg-[#f4ede2] ') +
      className
    }
    {...rest}
  >
    {children}
  </span>
);

export default Chip;
