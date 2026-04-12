import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_50%,transparent)] px-3 py-2 text-sm placeholder:text-[color:var(--muted)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:border-[color:var(--accent)]",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          "text-[color:var(--text)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
