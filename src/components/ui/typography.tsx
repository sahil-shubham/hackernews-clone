import React from 'react';

// Heading Component
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  // Add other common heading props like size, color if needed, map to Tailwind classes
}

export const Heading: React.FC<HeadingProps> = ({
  as: Component = 'h1', // Default to h1
  className,
  children,
  ...props
}) => {
  // Example: Basic styling, can be expanded with more props for different sizes/weights
  const baseStyle =
    Component === 'h1' ? 'text-4xl font-bold tracking-tight lg:text-5xl' :
    Component === 'h2' ? 'text-3xl font-semibold tracking-tight' :
    Component === 'h3' ? 'text-2xl font-semibold tracking-tight' :
    Component === 'h4' ? 'text-xl font-semibold tracking-tight' :
    Component === 'h5' ? 'text-lg font-semibold' :
    Component === 'h6' ? 'text-base font-semibold' :
    'text-lg'; // Default for unspecified or invalid 'as' prop

  return (
    <Component className={`${baseStyle} ${className || ''}`.trim()} {...props}>
      {children}
    </Component>
  );
};

// Text Component (Paragraph)
interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  // Example: Add props for size, weight, color, muted, etc.
  emphasis?: 'low' | 'medium' | 'high'; // For text color like muted, default, or strong
  size?: 'sm' | 'base' | 'lg'; // Example sizes
}

export const Text: React.FC<TextProps> = ({
  className,
  children,
  emphasis,
  size = 'base',
  ...props
}) => {
  let textColorClass = 'text-foreground'; // Default
  if (emphasis === 'low') textColorClass = 'text-muted-foreground';
  // if (emphasis === 'high') textColorClass = 'text-foreground-strong'; // if you have a stronger variant

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  const combinedClassName = [
    textColorClass,
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <p className={combinedClassName} {...props}>
      {children}
    </p>
  );
};

// ErrorText Component
interface ErrorTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  // Inherits p attributes, children, className
}

export const ErrorText: React.FC<ErrorTextProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p className={`text-sm font-medium text-destructive ${className || ''}`.trim()} {...props}>
      {children}
    </p>
  );
}; 