import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";
import { siteUrl } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Brickbaaz", template: "%s · Brickbaaz" },
  description: "Explore properties and builder projects in Gurugram with Brickbaaz. Compare details, request site visits and get property or loan assistance.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Brickbaaz", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport = {
  themeColor: "#0b1426",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
