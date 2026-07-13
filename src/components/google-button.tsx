import type { ButtonHTMLAttributes } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function GoogleButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string },
) {
  const { label = "Continue with Google", className = "", ...rest } = props;
  const [signingIn, setSigningIn] = useState(false);

  async function signInWithGoogle() {
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setSigningIn(false);
      toast.error("Unable to continue with Google", { description: error.message });
    }
  }

  return (
    <button
      {...rest}
      type="button"
      onClick={() => void signInWithGoogle()}
      disabled={signingIn || rest.disabled}
      className={`group inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-white/30 hover:bg-white/[0.08] active:scale-[0.99] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
