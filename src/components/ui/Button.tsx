import React from "react";
import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // 1. This is the base style from your old code
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        // 2. These are the variant styles from your old code, plus 'danger'
        primary:
          "bg-primary text-white hover:bg-primary-dark shadow-sm",
        secondary:
          "bg-white text-text-secondary border border-gray-300 hover:border-primary hover:text-primary shadow-sm",
        accent: // This was in your old code, so I'm keeping it
          "bg-accent text-white hover:bg-accent-dark shadow-sm",
        ghost:
          "bg-transparent text-text-secondary hover:text-primary",
        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700",
      },
      size: {
        // 3. This is the padding from your old code's 'baseStyle'
        default: "px-3 py-2",
        // 4. These are extra sizes for icon buttons, etc.
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10 p-2",
        xs: "py-1 px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default", // 5. We set our default size to match your old code
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size, // We now pass 'size'
  leftIcon,
  rightIcon,
  children,
  ...props
}) => {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {/* 6. This is the icon gap from your old code */}
      {leftIcon && <span className="mr-1.5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1.5">{rightIcon}</span>}
    </button>
  );
};

export default Button;