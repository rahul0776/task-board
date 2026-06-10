import React from 'react';

export type Priority = 'low' | 'medium' | 'high';

// Priority chip pairs from the design tokens:
// high #fde8d4/#c2410c · med #fdf3d4/#a16207 · low #e3ecf7/#3b5d83
const styles: Record<Priority, string> = {
  high: 'bg-[#fde8d4] text-[#c2410c]',
  medium: 'bg-[#fdf3d4] text-[#a16207]',
  low: 'bg-[#e3ecf7] text-[#3b5d83]',
};

const labels: Record<Priority, string> = {
  high: 'high',
  medium: 'med',
  low: 'low',
};

const PriorityBadge: React.FC<{ priority: Priority; className?: string }> = ({
  priority,
  className = '',
}) => (
  <span
    className={
      `font-mono text-[9.5px] font-medium uppercase tracking-[0.04em] rounded-[5px] px-1.5 py-0.5 ` +
      `${styles[priority]} ${className}`
    }
  >
    {labels[priority]}
  </span>
);

export default PriorityBadge;
