import BackBar from "@/components/BackBar";
import { ForgotForm } from "@/components/AuthForms";

export const metadata = { title: "Forgot password" };

export default function Forgot() {
  return (
    <>
      <BackBar title="Forgot password" fallback="/login" />
      <div className="space-y-5 px-4 pt-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Reset your password</h1>
          <p className="text-sm text-mute">Enter your email and we will send you a link to choose a new password.</p>
        </div>
        <ForgotForm />
      </div>
    </>
  );
}
