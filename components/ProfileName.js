"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/buyer";
import SubmitButton from "@/components/SubmitButton";
import { Card, inputCls } from "@/components/ui";

export default function ProfileName({ name, phone }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <Card>
      <form action={action} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-mute">Your name</span>
          <input name="name" defaultValue={name} maxLength={60} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-mute">Mobile number (shared with owner when you send an inquiry)</span>
          <input name="phone" defaultValue={phone ?? ""} inputMode="numeric" maxLength={10} placeholder="10-digit number" className={inputCls} />
        </label>
        <SubmitButton tone="soft" pendingText="Saving…">Save profile</SubmitButton>
      </form>
      {state?.error && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{state.error}</p>}
      {state?.ok && <p className="mt-1 text-xs font-semibold text-ok">Saved.</p>}
    </Card>
  );
}
