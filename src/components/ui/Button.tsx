import React from "react";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  leftIcon,
  ...props
}) => {
  const baseStyle =
    "flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 focus:outline-none active:scale-95";

  const variantStyles = {
    primary:
      "bg-primary text-white hover:bg-primary-dark shadow-sm",
    secondary:
      "bg-white text-text-secondary border border-gray-300 hover:border-primary hover:text-primary shadow-sm",
    accent:
      "bg-accent text-white hover:bg-accent-dark shadow-sm",
    ghost:
      "bg-transparent text-text-secondary hover:text-primary",
  };

  const padding = variant === "ghost" ? "px-2" : "px-4";
  const shadow = variant !== "ghost" ? "shadow-sm" : "";

  return (
    <button
      {...props}
      className={`${baseStyle} ${variantStyles[variant]} ${shadow} ${padding} ${
        props.className || ""
      }`}
    >
      {leftIcon && <span className="mr-1.5">{leftIcon}</span>}
      {children}
    </button>
  );
};

export default Button;