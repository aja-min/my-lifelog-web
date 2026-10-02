import View from "@/components/views/calendar";
import { getLifeLogs } from "@/lib/lifeLogs";
export const metadata = { title: "Calendar" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  return <View collection={await getLifeLogs()} searchParams={searchParams} />;
}
