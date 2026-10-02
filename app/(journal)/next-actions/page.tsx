import View from "@/components/views/next-actions";
import { getLifeLogs } from "@/lib/lifeLogs";
export const metadata = { title: "Next Actions" };
export default async function Page() {
  return <View collection={await getLifeLogs()} />;
}
