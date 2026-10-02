import View from "@/components/views/search";
import { getLifeLogs } from "@/lib/lifeLogs";
export const metadata = { title: "Search" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return <View collection={await getLifeLogs()} searchParams={searchParams} />;
}
