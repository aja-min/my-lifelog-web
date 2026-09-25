import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLifeLogs } from "@/lib/lifeLogs";
import { monthGrid, shiftMonth, todayTokyo, formatDate } from "@/lib/dates";
import { PageHeading, DataState } from "@/components/journal";
export const metadata = { title: "Calendar" };
export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const collection = await getLifeLogs();
  const { month: input } = await searchParams;
  const month =
    input && /^(?:19|20|21)\d{2}-(?:0[1-9]|1[0-2])$/.test(input)
      ? input
      : (collection.logs[0]?.date ?? todayTokyo()).slice(0, 7);
  const logs = new Map(collection.logs.map((log) => [log.date, log]));
  const count = collection.logs.filter((l) => l.date.startsWith(month)).length;
  return (
    <>
      <PageHeading
        title="カレンダー"
        description="日付を選択して記録を表示します。"
      />
      {collection.state !== "ready" ? (
        <DataState collection={collection} />
      ) : (
        <>
          <section className="calendar-card">
            <div className="calendar-toolbar">
              <h2>
                {Number(month.slice(0, 4))}年{" "}
                <strong>{Number(month.slice(5))}月</strong>
              </h2>
              <div>
                <span className="muted small">{count}日分の記録</span>
                <Link
                  className="button calendar-today"
                  href={`/calendar?month=${todayTokyo().slice(0, 7)}`}
                >
                  今月
                </Link>
                <Link
                  className="icon-button"
                  href={`/calendar?month=${shiftMonth(month, -1)}`}
                  aria-label="前月"
                >
                  <ChevronLeft size={20} />
                </Link>
                <Link
                  className="icon-button"
                  href={`/calendar?month=${shiftMonth(month, 1)}`}
                  aria-label="翌月"
                >
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
            <div className="month-grid">
              {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                <div className="month-weekday" key={day}>
                  {day}
                </div>
              ))}
              {monthGrid(month).map((date, i) => {
                const log = date ? logs.get(date) : null;
                return (
                  <div
                    className={`month-cell ${!date ? "outside" : ""} ${date === todayTokyo() ? "today" : ""}`}
                    key={date ?? i}
                  >
                    {log ? (
                      <Link
                        href={`/log/${date}`}
                        aria-label={`${formatDate(date!)}のLife Log`}
                      >
                        <span className="cell-day">
                          {Number(date!.slice(8))}
                          <i className="status-dot" />
                        </span>
                        <p>{log.oneLineSummary ?? log.summary ?? "Life Log"}</p>
                        <span className="cell-label">
                          Life Log <ChevronRight size={12} />
                        </span>
                      </Link>
                    ) : (
                      date && (
                        <span className="cell-day">
                          {Number(date.slice(8))}
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
            <div className="calendar-key">
              <span className="status-dot" />
              記録のある日をクリックして読む
            </div>
          </section>
          {!count && (
            <p className="calendar-empty">
              この月の記録はまだありません。前月・翌月も見てみましょう。
            </p>
          )}
        </>
      )}
    </>
  );
}
