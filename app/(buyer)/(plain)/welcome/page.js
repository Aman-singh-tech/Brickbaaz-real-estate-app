import { Logo } from "@/components/ui";
import CityPicker from "@/components/CityPicker";
import { CUSTOMER_CITIES } from "@/lib/city";

export const metadata = { title: "Welcome" };

export default async function Welcome() {
  const cities = CUSTOMER_CITIES;
  return (
    <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-10 text-center">
      <Logo size="text-2xl" />
      <div className="mx-auto grid h-40 w-full place-items-center rounded-3xl bg-gradient-to-br from-navy to-[#1c2c52] text-white">
        <p className="px-6 text-sm font-semibold text-white/80">Zero brokerage · Direct owner desk · Transparent pricing</p>
      </div>
      <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Find your dream home in India</h1>
      <p className="-mt-2 text-sm text-mute">Pick your city to see homes near you.</p>
      <CityPicker cities={cities} />
    </div>
  );
}
