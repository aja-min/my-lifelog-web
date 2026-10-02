import View from "@/components/views/log";
import { getLifeLogs } from "@/lib/lifeLogs";
export default async function Page({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const collection = await getLifeLogs();
  return <View collection={collection} date={(await params).date} />;
}
