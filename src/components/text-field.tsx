import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, hint, error, icon, id, className = "", type = "text", ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const actualType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className="group flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-xl border border-white/10 bg-white/[0.03] transition-all focus-within:border-teal/60 focus-within:bg-white/[0.05] focus-within:ring-2 focus-within:ring-teal/20 ${
          error ? "border-destructive/70" : ""
        }`}
      >
        {icon && (
          <span className="pl-3.5 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={actualType}
          className={`w-full bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none ${
            icon ? "pl-2.5" : ""
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="mr-2 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:text-foreground"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground/70">{hint}</p>
      ) : null}
    </div>
  );
});
