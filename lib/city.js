export const DEFAULT_CITY = "Gurugram";
export const CUSTOMER_CITIES = [DEFAULT_CITY];

export function canonicalCity(city) {
  return /^(gurgaon|gurugram)$/i.test(String(city).trim()) ? DEFAULT_CITY : city;
}

export function cityWhere(city) {
  return canonicalCity(city) === DEFAULT_CITY
    ? { city: { in: ["Gurugram", "Gurgaon"], mode: "insensitive" } }
    : { city };
}
