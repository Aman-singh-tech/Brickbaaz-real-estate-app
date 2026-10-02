"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { inputCls, cx } from "@/components/ui";
import { signUp, logIn, forgotPassword, resetPassword, resendVerification } from "@/app/actions/auth";

const Err = ({ children }) => (children ? <p role="alert" className="text-xs font-semibold text-red-600">{children}</p> : null);

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-mute">{label}</span>
      {children}
    </label>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.2a11 11 0 0 0 0 9.9l3.6-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

export default function AuthTabs({ next, google, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [login, loginAction] = useActionState(logIn, null);
  const [signup, signupAction] = useActionState(signUp, null);

  return (
    <div className="space-y-4">
      <div role="tablist" className="grid grid-cols-2 rounded-xl bg-fill p-1 text-center text-[13px] font-bold">
        {[["login", "Log In"], ["signup", "Sign Up"]].map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={mode === v} onClick={() => setMode(v)} className={cx("rounded-lg py-2.5", mode === v ? "bg-navy text-white" : "text-mute")}>
            {l}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <form action={loginAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <Field label="Email"><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={inputCls} /></Field>
          <Field label="Password"><input name="password" type="password" autoComplete="current-password" required className={inputCls} /></Field>
          <div className="text-right"><Link href="/forgot-password" className="text-xs font-bold text-brand">Forgot password?</Link></div>
          <Err>{login?.error}</Err>
          <SubmitButton pendingText="Logging in…">Log In →</SubmitButton>
        </form>
      ) : (
        <form action={signupAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <Field label="Full name"><input name="name" autoComplete="name" maxLength={60} required className={inputCls} /></Field>
          <Field label="Email"><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={inputCls} /></Field>
          <Field label="Password (min 8 characters)"><input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></Field>
          <Err>{signup?.error}</Err>
          <SubmitButton pendingText="Creating account…">Create account →</SubmitButton>
        </form>
      )}

      {google && (
        <>
          <p className="flex items-center gap-3 text-xs text-mute"><span className="h-px flex-1 bg-line" />or continue with<span className="h-px flex-1 bg-line" /></p>
          <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="flex items-center justify-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-[13.5px] font-bold">
            <GoogleIcon /> Continue with Google
          </a>
        </>
      )}
    </div>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPassword, null);
  if (state?.ok)
    return (
      <div className="space-y-3 text-center">
        <p className="rounded-xl bg-fill px-4 py-4 text-sm font-semibold">If an account exists for that email, we have sent a reset link. It works for 30 minutes.</p>
        {state.devLink && (
          <p className="break-all rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">Dev mode (no email service): <a className="underline" href={state.devLink}>open the reset link</a></p>
        )}
      </div>
    );
  return (
    <form action={action} className="space-y-3">
      <Field label="Your account email"><input name="email" type="email" autoComplete="email" required className={inputCls} /></Field>
      <Err>{state?.error}</Err>
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm({ token }) {
  const [state, action] = useActionState(resetPassword, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Field label="New password (min 8 characters)"><input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></Field>
      <Err>{state?.error}</Err>
      <SubmitButton pendingText="Saving…">Set new password</SubmitButton>
    </form>
  );
}

export function ResendVerification() {
  const [state, action] = useActionState(resendVerification, null);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton tone="soft" pendingText="Sending…">Resend verification email</SubmitButton>
      {state?.ok && !state.already && <p role="status" className="text-xs font-semibold text-ok">Verification email sent.</p>}
      {state?.devLink && <p className="break-all rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">Dev mode: <a className="underline" href={state.devLink}>open the verification link</a></p>}
      <Err>{state?.error}</Err>
    </form>
  );
}
