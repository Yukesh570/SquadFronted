import React from "react";
import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary-dark shadow-sm",
        secondary:
          "bg-white text-text-secondary border border-gray-300 hover:border-primary hover:text-primary shadow-sm",
        accent:
          "bg-accent text-white hover:bg-accent-dark shadow-sm",
        ghost:
          "bg-transparent text-text-secondary hover:text-primary",
        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700",
      },
      size: {
        default: "px-3 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10 p-2",
        xs: "py-1 px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
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
  size,
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
      {leftIcon && <span className="mr-1.5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1.5">{rightIcon}</span>}
    </button>
  );
};

export default Button;