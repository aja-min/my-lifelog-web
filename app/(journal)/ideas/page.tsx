import View from "@/components/views/ideas";
import { getLifeLogs } from "@/lib/lifeLogs";
export const metadata = { title: "Ideas" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  return <View collection={await getLifeLogs()} searchParams={searchParams} />;
}
