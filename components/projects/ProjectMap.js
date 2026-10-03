"use client";
import { useRouter } from "next/navigation";
import MiniMap from "@/components/MiniMap";
export default function ProjectMap({ markers }) {
  const router = useRouter();
  return (
    <div>
      <div className="h-96 overflow-hidden rounded-2xl border border-line">
        <MiniMap markers={markers} onMarkerClick={(m) => router.push(m.href)} />
      </div>
      <p className="mt-2 text-xs text-mute">
        Tap a project pin for details. Projects without a location pin are shown
        in the list below.
      </p>
    </div>
  );
}
