// Demo data for local development: node prisma/seed.js
// Creates the owner account (from .env) and a few sample listings without photos.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = String(process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
if (!email) throw new Error("Set OWNER_EMAIL in .env first");

let owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
owner = owner
  ? await prisma.user.update({ where: { id: owner.id }, data: { email, emailVerified: true } })
  : await prisma.user.create({ data: { email, emailVerified: true, role: "OWNER", name: process.env.OWNER_NAME || "Owner" } });

const base = { ownerId: owner.id, status: "ACTIVE", publishedAt: new Date() };
const listings = [
  {
    purpose: "SALE", type: "APARTMENT", title: "3 BHK Sea-Breeze Luxury Residence", city: "Mumbai", state: "Maharashtra",
    locality: "Carter Road, Bandra West", society: "Sea Breeze Heights", lat: 19.0705, lng: 72.8222,
    bedrooms: 3, bathrooms: 3, balconies: 1, carpetArea: 1290, superArea: 1550, floor: 14, totalFloors: 22,
    furnishing: "Semi-Furnished", facing: "Sea", possession: "READY", reraId: "P51800029381", price: 37500000, featured: true,
    amenities: ["24/7 Security", "Infinity Swimming Pool", "Clubhouse & Gym", "100% Power Backup", "Children's Play Zone", "EV Charging", "Video Intercom", "High-speed Lifts"],
    nearby: [{ label: "Metro Line 2B", distance: "800 m" }, { label: "Lilavati Hospital", distance: "1.2 km" }, { label: "Int'l Airport", distance: "6.5 km" }],
    description: "Spacious sea-facing 3 BHK home featuring Italian marble flooring, panoramic Arabian Sea views, modular German kitchen, and a private elevator lobby. Two reserved covered parking spots in the basement.",
  },
  {
    purpose: "SALE", type: "APARTMENT", title: "2 BHK Sea-view Apartment", city: "Mumbai", state: "Maharashtra",
    locality: "Worli Sea Face", society: null, lat: 19.0176, lng: 72.8153, bedrooms: 2, bathrooms: 2, balconies: 1,
    carpetArea: 980, superArea: 1150, floor: 9, totalFloors: 32, furnishing: "Semi-Furnished", facing: "East", possession: "READY",
    price: 18500000, amenities: ["24/7 Security", "Clubhouse & Gym", "High-speed Lifts"],
    description: "Bright 2 BHK with a sea view on the 9th floor of a 32-storey tower.",
  },
  {
    purpose: "SALE", type: "APARTMENT", title: "1 BHK Smart Living Flat", city: "Mumbai", state: "Maharashtra",
    locality: "Chakala, Andheri East", lat: 19.1136, lng: 72.8697, bedrooms: 1, bathrooms: 1, balconies: 1,
    carpetArea: 480, superArea: 620, floor: 6, totalFloors: 18, furnishing: "Unfurnished", possession: "READY", price: 7500000,
    amenities: ["24/7 Security", "Covered Parking"], nearby: [{ label: "Western Metro", distance: "300 m" }],
    description: "Compact, well-planned 1 BHK close to the metro and the airport.",
  },
  {
    purpose: "SALE", type: "APARTMENT", title: "3 BHK Luxury Penthouse", city: "Mumbai", state: "Maharashtra",
    locality: "Hiranandani Gardens, Powai", lat: 19.1197, lng: 72.9051, bedrooms: 3, bathrooms: 3, balconies: 2,
    carpetArea: 1650, superArea: 1980, floor: 28, totalFloors: 30, furnishing: "Fully Furnished", facing: "Garden", possession: "READY",
    reraId: "P51800011111", price: 32000000, featured: true,
    amenities: ["Infinity Swimming Pool", "Clubhouse & Gym", "Garden", "100% Power Backup"],
    description: "Top-floor penthouse with lake views, fully furnished, with exclusive terrace access.",
  },
  {
    purpose: "SALE", type: "APARTMENT", title: "2 BHK Spacious Home", city: "Mumbai", state: "Maharashtra",
    locality: "Ghodbunder Road, Thane West", lat: 19.2547, lng: 72.9718, bedrooms: 2, bathrooms: 2, balconies: 1,
    carpetArea: 820, superArea: 1050, floor: 12, totalFloors: 40, furnishing: "Unfurnished", possession: "UNDER_CONSTRUCTION", possessionBy: "Dec 2027",
    price: 9200000, amenities: ["Clubhouse & Gym", "Garden", "Children's Play Zone"],
    description: "Under-construction 2 BHK with a flexible payment plan. Booking from 1 Lakh.",
  },
  {
    purpose: "RENT", type: "APARTMENT", title: "2 BHK Sunlit Modern Flat", city: "Bengaluru", state: "Karnataka",
    locality: "ITPB Main Road, Whitefield", lat: 12.9698, lng: 77.7499, bedrooms: 2, bathrooms: 2, balconies: 1,
    carpetArea: 1000, superArea: 1220, floor: 5, totalFloors: 14, furnishing: "Semi-Furnished", facing: "East", possession: "READY",
    price: 38000, deposit: 150000, amenities: ["24/7 Security", "Covered Parking", "Clubhouse & Gym"],
    nearby: [{ label: "Kadugodi Metro", distance: "400 m" }],
    description: "Sunlit 2 BHK near the tech parks, semi-furnished with wardrobes and modular kitchen.",
  },
  {
    purpose: "SALE", type: "VILLA", title: "4 BHK Premium Garden Villa", city: "Hyderabad", state: "Telangana",
    locality: "Road No. 36, Jubilee Hills", lat: 17.4326, lng: 78.4071, bedrooms: 4, bathrooms: 5, balconies: 3,
    carpetArea: 3000, superArea: 3400, floor: 0, totalFloors: 3, furnishing: "Semi-Furnished", possession: "READY",
    price: 52000000, featured: true, amenities: ["24/7 Security", "Garden", "Covered Parking", "100% Power Backup"],
    description: "Gated-community villa with a private lawn and space for three cars.",
  },
  {
    purpose: "RENT", type: "COMMERCIAL", title: "Commercial Office Space", city: "Mumbai", state: "Maharashtra",
    locality: "G Block, BKC", lat: 19.0596, lng: 72.8656, bathrooms: 2, carpetArea: 1850, superArea: 2100, floor: 7, totalFloors: 12,
    furnishing: "Fully Furnished", possession: "READY", price: 120000, deposit: 600000, amenities: ["24/7 Security", "High-speed Lifts", "100% Power Backup"],
    description: "Ready office with workstations, two cabins and a pantry in the heart of BKC.",
  },
];

await prisma.inquiry.deleteMany({ where: { property: { ownerId: owner.id } } });
await prisma.property.deleteMany({ where: { ownerId: owner.id } });
for (const l of listings) await prisma.property.create({ data: { ...base, ...l } });

console.log(`Seeded owner ${email} and ${listings.length} listings.`);
await prisma.$disconnect();
