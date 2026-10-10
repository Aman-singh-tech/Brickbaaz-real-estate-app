export const CITIES = [
  { name: "Gurugram", state: "Haryana" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Bengaluru", state: "Karnataka" },
  { name: "Delhi NCR", state: "Delhi" },
  { name: "Hyderabad", state: "Telangana" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Chennai", state: "Tamil Nadu" },
];
export const stateOf = (city) => CITIES.find((c) => c.name === city)?.state ?? "";
export const cityLabel = (city, state) => {
  const st = state || stateOf(city);
  return city ? (st && st !== city ? `${city}, ${st}` : city) : "";
};

export const TYPE_LABEL = {
  APARTMENT: "Apartment",
  VILLA: "Villa / House",
  BUILDER_FLOOR: "Builder Floor",
  PLOT: "Plot / Land",
  COMMERCIAL: "Commercial",
  FARM_HOUSE: "Farm House",
};
export const STATUS_LABEL = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  RENTED: "Rented",
  SOLD: "Sold",
};
export const AMENITIES = [
  "24/7 Security", "Infinity Swimming Pool", "Clubhouse & Gym", "100% Power Backup",
  "Children's Play Zone", "EV Charging", "Video Intercom", "High-speed Lifts",
  "Covered Parking", "Garden", "Vastu Compliant", "Borewell & Corporation Water",
];
export const FURNISHING = ["Unfurnished", "Semi-Furnished", "Fully Furnished"];
export const FACING = ["East", "West", "North", "South", "Sea", "Garden"];

const trim = (n) => String(Number(n.toFixed(2)));
export function formatInr(n) {
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} ${n >= 2e5 ? "Lakhs" : "Lakh"}`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
export const formatPrice = (p) =>
  p.purpose === "RENT" ? `₹${p.price.toLocaleString("en-IN")}` : formatInr(p.price);
export const perSqft = (p) =>
  p.purpose === "SALE" && p.superArea ? `₹${Math.round(p.price / p.superArea).toLocaleString("en-IN")}/sq.ft` : null;

export function emi(principal, ratePct, years) {
  const r = ratePct / 12 / 100;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
}

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const bhkLabel = (p) =>
  p.type === "PLOT" ? "Plot" : p.type === "COMMERCIAL" ? "Commercial" : p.bedrooms ? `${p.bedrooms} BHK` : TYPE_LABEL[p.type];

export const CITY_COORDS = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  "Delhi NCR": { lat: 28.6139, lng: 77.209 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
};

export const ordinal = (n) => {
  const v = n % 100;
  return n + (["th", "st", "nd", "rd"][(v - 20) % 10] || ["th", "st", "nd", "rd"][v] || "th");
};

// Cloudinary delivery transform (auto format/quality + width). Local /api/media URLs pass through unchanged.
export const imgUrl = (url, w = 800) =>
  url && url.includes("res.cloudinary.com") && url.includes("/image/upload/")
    ? url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${w},c_limit/`)
    : url;
