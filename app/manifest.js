export default function manifest() {
  return {
    id: "/",
    name: "Brickbaaz – Buy & Rent Homes",
    short_name: "Brickbaaz",
    description: "Search, shortlist and connect with genuine property owners. Zero brokerage.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7fb",
    theme_color: "#0b1426",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
