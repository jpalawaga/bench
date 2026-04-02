import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--color-button-primary-border)] bg-[var(--color-button-primary-bg)] text-[var(--color-button-primary-text)] shadow-[0_10px_30px_rgba(0,0,0,0.28)] active:bg-[var(--color-button-primary-bg-active)] active:text-[var(--color-button-primary-text-active)]",
  secondary:
    "bg-surface-raised text-text-primary border border-border active:bg-surface-overlay",
  danger: "bg-danger text-white active:bg-danger-hover",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-xl px-6 py-3 text-base font-semibold
        transition-colors duration-100
        disabled:opacity-40 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
