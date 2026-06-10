import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

// Landing-page card: white, 1px #ece3d6 border, 16-18px radius,
// hover lift with warm shadow.
const Card: React.FC<CardProps> = ({ hover = false, className = '', children, ...rest }) => (
  <div
    className={
      'bg-surface-card border border-line rounded-2xl ' +
      (hover
        ? 'transition-[transform,box-shadow,border-color] duration-[250ms] ease-out ' +
          'hover:-translate-y-1 hover:border-[#e2cfb6] hover:shadow-card-warm ' +
          'motion-reduce:transition-none motion-reduce:hover:transform-none '
        : '') +
      className
    }
    {...rest}
  >
    {children}
  </div>
);

export default Card;
