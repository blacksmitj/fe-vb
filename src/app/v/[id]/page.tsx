import { redirect } from "next/navigation";

interface ShortLinkPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { id } = await params;
  
  // Mengarahkan (redirect) ke rute halaman verifikasi asli
  redirect(`/programs/${id}/verification`);
}
