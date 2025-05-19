'use client'; // If it has event handlers like onClick directly, otherwise not strictly needed if just styling

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  // Add any other custom props you might need, e.g., isLoading, fullWidth
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseStyle = 
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    // Variant styles
    let variantStyle = '';
    switch (variant) {
      case 'outline':
        variantStyle = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
        break;
      case 'secondary':
        variantStyle = 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
        break;
      case 'ghost':
        variantStyle = 'hover:bg-accent hover:text-accent-foreground';
        break;
      case 'link':
        variantStyle = 'text-primary underline-offset-4 hover:underline';
        break;
      case 'destructive':
        variantStyle = 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
        break;
      default: // default variant
        variantStyle = 'bg-primary text-primary-foreground hover:bg-primary/90';
        break;
    }

    // Size styles
    let sizeStyle = '';
    switch (size) {
      case 'sm':
        sizeStyle = 'h-9 px-3'; // rounded-md is already in baseStyle for default
        break;
      case 'lg':
        sizeStyle = 'h-11 px-8'; // rounded-md is already in baseStyle for default
        break;
      case 'icon':
        sizeStyle = 'h-10 w-10';
        break;
      default: // default size
        sizeStyle = 'h-10 px-4 py-2';
        break;
    }

    return (
      <button
        className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ''}`.trim()}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button }; 