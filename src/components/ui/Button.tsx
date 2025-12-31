import React from "react";
import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary-dark shadow-sm focus:ring-primary",
        secondary:
          "bg-white text-text-secondary border border-gray-200 hover:bg-gray-50 focus:ring-gray-200 shadow-input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700",

        accent:
          "bg-accent text-white hover:bg-accent-dark shadow-sm focus:ring-accent",

        ghost:
          "bg-transparent text-text-secondary hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800",

        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10 p-2",
        xs: "py-1.5 px-2.5 text-xs",
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
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size,
  leftIcon,
  rightIcon,
  children,
  isLoading,
  disabled,
  ...props
}) => {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
