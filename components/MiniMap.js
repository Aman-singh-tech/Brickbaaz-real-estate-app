"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-fill" />,
});

// Static-ish single-pin map used on detail pages and in the post wizard.
export default function MiniMap(props) {
  return <MapView {...props} />;
}
