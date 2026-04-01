import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-text-secondary text-sm">{label}</label>
      )}
      <input
        className={`
          bg-surface-raised border border-border rounded-lg
          px-3 py-2 text-lg text-text-primary
          placeholder:text-text-muted
          focus:outline-none focus:border-accent
          transition-colors
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
