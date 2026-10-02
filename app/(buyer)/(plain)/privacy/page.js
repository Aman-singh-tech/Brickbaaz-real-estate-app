import BackBar from "@/components/BackBar";

export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <>
      <BackBar title="Privacy Policy" />
      <div className="space-y-3 px-4 py-5 text-sm leading-relaxed text-mute">
        <p><b className="text-ink">Placeholder.</b> Replace this page with your final Privacy Policy reviewed by your legal advisor.</p>
        <p>We store your mobile number, name, saved properties and inquiries to run the service. We do not sell your data. Your number is shared with the owner only when you send an inquiry.</p>
      </div>
    </>
  );
}
