import Link from "next/link";
import { Card, btn } from "@/components/ui";

export const metadata = {
  title: "Property submitted · Brickbaaz",
  robots: { index: false, follow: false },
};

export default async function SubmittedProperty({ searchParams }) {
  const id = Number((await searchParams).id);
  return (
    <main className="mx-auto max-w-xl p-5">
      <Card className="space-y-5">
        <h1 className="text-2xl font-bold">Your property is published</h1>
        <p>
          Brickbaaz has received your property and contact details. Your listing
          is available to customers through matching location and search
          filters.
        </p>
        {Number.isSafeInteger(id) && id > 0 && (
          <Link href={`/property/${id}`} className={btn("primary")}>
            View property
          </Link>
        )}
        <p className="text-sm text-mute">
          This link has now been used. Ask Brickbaaz for a new link to submit
          another property.
        </p>
      </Card>
    </main>
  );
}
