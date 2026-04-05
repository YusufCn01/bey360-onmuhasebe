import { EDonusumListPage } from "@/components/edonusum/e-donusum-list-page";

export default async function Page({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  return <EDonusumListPage categoryKey="gelenIrsaliyeler" filters={await searchParams} />;
}
