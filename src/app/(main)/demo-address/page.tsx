import { StreetAddressDemo } from "@/components/verification/components/StreetAddressDemo";

export const metadata = {
  title: "Demo Verifikasi Alamat Jalan - Antigravity",
  description: "Demo komponen input verifikasi nama jalan dengan magic wand dan RT/RW parsing.",
};

export default function DemoAddressPage() {
  return (
    <div className="container mx-auto py-8">
      <StreetAddressDemo />
    </div>
  );
}
