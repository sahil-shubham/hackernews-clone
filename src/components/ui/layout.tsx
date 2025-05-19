import React from 'react';

interface FlexContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: string; // e.g., '2', '4', 'px', 'rem' units need to be handled if not direct Tailwind numbers
  wrap?: 'wrap' | 'wrap-reverse' | 'nowrap';
}

export const FlexContainer: React.FC<FlexContainerProps> = ({
  direction = 'row',
  justify = 'start',
  align = 'stretch',
  gap,
  wrap = 'nowrap',
  className,
  children,
  ...props
}) => {
  const directionClasses = {
    row: 'flex-row',
    'row-reverse': 'flex-row-reverse',
    col: 'flex-col',
    'col-reverse': 'flex-col-reverse',
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  };

  const wrapClasses = {
    wrap: 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
    nowrap: 'flex-nowrap',
  };
  
  // For gap, Tailwind expects utilities like gap-1, gap-2, gap-x-1, gap-y-2 etc.
  // This simple version assumes gap is a number for Tailwind's scale (e.g., gap="4" -> gap-4)
  // Or you can pass the full class e.g. gap="px" for gap-px
  const gapClass = gap ? `gap-${gap}` : '';

  const combinedClassName = [
    'flex',
    directionClasses[direction],
    justifyClasses[justify],
    alignClasses[align],
    wrapClasses[wrap],
    gapClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

// Optional PageContainer if widely used with consistent styling
interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  // no custom props for now, just children and className
}
export const PageContainer: React.FC<PageContainerProps> = ({ className, children, ...props }) => {
  return (
    <div className={`container mx-auto px-4 ${className || ''}`} {...props}>
      {/* Default max-width can be applied here e.g. max-w-7xl, or controlled by parent via className */}
      {children}
    </div>
  );
}; 