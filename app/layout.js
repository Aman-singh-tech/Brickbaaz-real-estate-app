import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata = {
  title: { default: "Brickbaaz", template: "%s · Brickbaaz" },
  description: "Search, shortlist and connect with genuine property owners. Zero brokerage.",
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
