"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const baseField =
  "w-full rounded-2xl border border-blush-200/70 bg-white/70 px-4 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-soft/70 focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-300/40 " +
  "dark:border-white/10 dark:bg-white/5";

interface FieldWrapProps {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

function FieldWrap({ label, hint, children, className }: FieldWrapProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      {label && <span className="block text-xs font-semibold text-ink-soft">{label}</span>}
      {children}
      {hint && <span className="block text-xs text-ink-soft/80">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }
>(function Input({ label, hint, className, ...rest }, ref) {
  return (
    <FieldWrap label={label} hint={hint} className={className}>
      <input ref={ref} className={baseField} {...rest} />
    </FieldWrap>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }
>(function Textarea({ label, hint, className, ...rest }, ref) {
  return (
    <FieldWrap label={label} hint={hint} className={className}>
      <textarea ref={ref} className={cn(baseField, "min-h-24 resize-y")} {...rest} />
    </FieldWrap>
  );
});

export const Select = forwardRef<HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string }
>(function Select({ label, hint, className, children, ...rest }, ref) {
  return (
    <FieldWrap label={label} hint={hint} className={className}>
      <select ref={ref} className={baseField} {...rest}>{children}</select>
    </FieldWrap>
  );
});
