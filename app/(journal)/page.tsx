import { getLifeLogs } from "@/lib/lifeLogs";
import {
  PageHeading,
  DayHero,
  Summary,
  Findings,
  Categories,
  RecentLogs,
  HomeRail,
  DataState,
} from "@/components/journal";
import { CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/dates";
export default async function Home() {
  const collection = await getLifeLogs();
  const log = collection.logs[0];
  return (
    <>
      <PageHeading
        title="ホーム"
        aside={
          log && (
            <span className="heading-date">
              <CalendarDays size={15} />
              {formatDate(log.date)}
            </span>
          )
        }
      />
      {!log ? (
        <DataState collection={collection} />
      ) : (
        <div className="home-layout">
          <div className="home-main">
            <DayHero log={log} />
            <Summary log={log} />
            <Findings log={log} />
            <div>
              <SectionIntro />
              <Categories log={log} compact />
            </div>
            <RecentLogs logs={collection.logs} />
          </div>
          <HomeRail logs={collection.logs} />
        </div>
      )}
    </>
  );
}
function SectionIntro() {
  return (
    <div className="section-title">
      <h2>カテゴリ別の記録</h2>
    </div>
  );
}
