import { Card } from "@/components/ui";

export const metadata = {
  title: "Property submitted · Brickbaaz",
  robots: { index: false, follow: false },
};

export default function SubmittedProperty() {
  return (
    <main className="mx-auto max-w-xl p-5">
      <Card className="space-y-5">
        <h1 className="text-2xl font-bold">Property submitted for approval</h1>
        <p>
          Brickbaaz has received your property and contact details. Your listing
          will become visible to customers after the property owner reviews and
          approves it.
        </p>
        <p className="text-sm text-mute">
          This link has now been used. Ask Brickbaaz for a new link to submit
          another property.
        </p>
      </Card>
    </main>
  );
}
