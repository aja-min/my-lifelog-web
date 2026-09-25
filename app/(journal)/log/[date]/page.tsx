import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getLifeLogs } from "@/lib/lifeLogs";
import { dateFromFilename } from "@/lib/parseLifeLog";
import { formatDate } from "@/lib/dates";
import {
  PageHeading,
  DayHero,
  Summary,
  Findings,
  Categories,
  ExtraSections,
  Keywords,
  DataState,
} from "@/components/journal";
export default async function LogPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const collection = await getLifeLogs();
  if (
    !dateFromFilename(`Lifelog_${date.replaceAll("-", "")}.md`) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  )
    notFound();
  if (collection.state !== "ready")
    return <DataState collection={collection} />;
  const index = collection.logs.findIndex((l) => l.date === date);
  if (index < 0) notFound();
  const log = collection.logs[index];
  const previous = collection.logs[index + 1];
  const next = collection.logs[index - 1];
  return (
    <div className="reading-width">
      <Link className="back-link" href="/calendar">
        <ArrowLeft size={15} />
        カレンダーへ
      </Link>
      <PageHeading
        title={formatDate(date, false)}
        description={new Intl.DateTimeFormat("ja-JP", {
          weekday: "long",
        }).format(new Date(`${date}T12:00:00+09:00`))}
      />
      <article className="log-article">
        <DayHero log={log} detail />
        <Summary log={log} />
        <ExtraSections log={log} kind="events" />
        <Categories log={log} />
        <Keywords log={log} />
        <Findings log={log} />
        <ExtraSections log={log} kind="other" />
        <details className="raw-markdown">
          <summary>Raw Markdownを見る</summary>
          <pre>{log.rawMarkdown}</pre>
        </details>
      </article>
      <nav className="day-pagination" aria-label="前後の記録">
        {previous ? (
          <Link href={`/log/${previous.date}`}>
            <ArrowLeft size={16} />
            <span>
              前の記録<small>{formatDate(previous.date, false)}</small>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/log/${next.date}`}>
            <span>
              次の記録<small>{formatDate(next.date, false)}</small>
            </span>
            <ArrowRight size={16} />
          </Link>
        )}
      </nav>
    </div>
  );
}
