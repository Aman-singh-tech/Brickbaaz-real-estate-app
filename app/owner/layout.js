export const metadata = {
  title: { default: "Owner", template: "%s · Brickbaaz Owner" },
  manifest: "/owner.webmanifest",
  icons: { icon: "/icons/owner-192.png", apple: "/icons/owner-apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "BB Owner", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#e07a1f" };

export default function OwnerRoot({ children }) {
  return children;
}
