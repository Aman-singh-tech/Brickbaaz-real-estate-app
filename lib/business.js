import "server-only";

const DEFAULT_DESK = { label: "99585 30090", number: "919958530090" };
const text = (value, limit = 500) =>
  String(value || "")
    .trim()
    .slice(0, limit);
function phone(value) {
  const raw = text(value, 40);
  if (!/^[+\d\s()-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  // Replace the retired enquiry number even when an older Render variable remains set.
  if (digits === "8920346288" || digits === "918920346288") return DEFAULT_DESK;
  if (digits.length < 10 || digits.length > 15 || digits === "9999900000")
    return null;
  return { label: raw, number: digits.length === 10 ? "91" + digits : digits };
}
export function businessInfo() {
  const desk =
    phone(process.env.SUPPORT_PHONE) || phone(process.env.OWNER_PHONE) || DEFAULT_DESK;
  const whatsapp = phone(process.env.SUPPORT_WHATSAPP) || desk;
  const email = text(process.env.SUPPORT_EMAIL, 200);
  return {
    intro:
      text(process.env.BRICKBAAZ_ABOUT, 1200) ||
      "Brickbaaz helps you explore properties and builder projects in Gurugram, compare listing details, and connect with our property desk. From your first enquiry to a requested site visit, keep your next move in one place.",
    phone: desk,
    whatsapp: whatsapp
      ? whatsapp.number.length === 10
        ? "91" + whatsapp.number
        : whatsapp.number
      : null,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
    address: text(process.env.BRICKBAAZ_OFFICE_ADDRESS),
    hours: text(process.env.BRICKBAAZ_WORKING_HOURS, 200),
  };
}
