import BackBar from "@/components/BackBar";

export const metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <>
      <BackBar title="Terms of Service" />
      <div className="space-y-3 px-4 py-5 text-sm leading-relaxed text-mute">
        <p><b className="text-ink">Placeholder.</b> Replace this page with your final Terms of Service reviewed by your legal advisor.</p>
        <p>Brickbaaz lists properties for information only. Prices, availability and details are provided by the owner and may change. Visit and inspect a property before paying any amount.</p>
      </div>
    </>
  );
}
