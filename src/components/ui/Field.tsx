import { useState, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60";

interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  id: string;
}

export function Field({
  label,
  error,
  hint,
  id,
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(base, invalid && "border-destructive", className)} {...props} />;
}

export function PasswordInput({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(base, "pr-12", invalid && "border-destructive", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-[#7b866f] transition-colors hover:text-[#344a35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#71816a]"
      >
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-[19px]"
          initial={false}
          animate={{ scale: visible ? 1.06 : 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          aria-hidden="true"
        >
          <motion.path
            d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.circle
            cx="12"
            cy="12"
            r="2.7"
            stroke="currentColor"
            strokeWidth="1.7"
            animate={{ scale: visible ? 1 : 0.72, opacity: visible ? 1 : 0.72 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
          />
          <motion.path
            d="M4 4 20 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={false}
            animate={{ opacity: visible ? 0 : 1, pathLength: visible ? 0 : 1 }}
            transition={{ duration: 0.18 }}
          />
        </motion.svg>
      </button>
    </div>
  );
}

export function TextArea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn(base, "min-h-28 resize-y", invalid && "border-destructive", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(base, "cursor-pointer appearance-none pr-10")} {...props} />;
}
