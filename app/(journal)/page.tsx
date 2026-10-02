import View from "@/components/views/home";
import { getLifeLogs } from "@/lib/lifeLogs";
export default async function Page() {
  return <View collection={await getLifeLogs()} />;
}
