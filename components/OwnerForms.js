"use client";

import { useActionState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { inputCls } from "@/components/ui";
import { ownerLogin } from "@/app/actions/auth";

export default function OwnerLogin() {
  const [state, action] = useActionState(ownerLogin, null);
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-mute">Owner email</span>
        <input name="email" type="email" autoComplete="username" required className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-mute">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className={inputCls} />
      </label>
      {state?.error && <p role="alert" className="text-xs font-semibold text-red-600">{state.error}</p>}
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
