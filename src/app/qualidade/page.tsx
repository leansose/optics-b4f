import { Quality } from "@/components/quality";
import { loadNetwork } from "@/services/data";
export default async function Page() {
  const { orphans, duplicates, convertedDates } = await loadNetwork();
  return <Quality data={{ orphans, duplicates, convertedDates }} />;
}
