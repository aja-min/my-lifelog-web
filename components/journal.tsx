import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Sparkles,
  Lightbulb,
  Feather,
  Utensils,
  BriefcaseBusiness,
  House,
  CircleCheck,
  Hourglass,
  Check,
  BookOpen,
  CloudOff,
} from "lucide-react";
import type { LifeLog, SectionKind } from "@/lib/types";
import type { LogCollection } from "@/lib/lifeLogs";
import { formatDate, monthGrid, todayTokyo } from "@/lib/dates";
import { Markdown } from "./markdown";

export function PageHeading({
  title,
  description,
  aside,
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {aside}
    </header>
  );
}
export function DataState({ collection }: { collection: LogCollection }) {
  if (collection.state === "ready" && collection.logs.length) return null;
  const error = collection.state === "error";
  return (
    <div className="empty-state">
      <span className="empty-icon">{error ? <CloudOff /> : <BookOpen />}</span>
      <h2>
        {error
          ? "記録を読み込めませんでした"
          : collection.state === "unconfigured"
            ? "Google Driveが未設定です"
            : "日次記録がありません"}
      </h2>
      <p>
        {error
          ? "Google Driveへの接続とフォルダの共有設定を確認してください。少し待ってから、もう一度お試しください。"
          : collection.state === "unconfigured"
            ? "Google Driveを設定すると、日次Life Logがここに並びます。READMEの手順に沿って接続してください。"
            : "対象フォルダに Lifelog_YYYYMMDD.md が追加されると、ここに表示されます。"}
      </p>
      <Link href={error ? "/" : "/settings"} className="button">
        {error ? "もう一度読み込む" : "接続設定を見る"}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
export function SectionTitle({
  icon,
  children,
  link,
  href,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  link?: string;
  href?: string;
}) {
  return (
    <div className="section-title">
      <h2>
        {icon}
        {children}
      </h2>
      {href && (
        <Link href={href}>
          {link}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
export function DayHero({
  log,
  detail = false,
}: {
  log: LifeLog;
  detail?: boolean;
}) {
  return (
    <section className="day-hero">
      <div className="hero-top">
        <span className="pill">
          <span className="status-dot" />
          {detail ? "日次記録" : "最新の記録"}
        </span>
        <span className="hero-date">{formatDate(log.date)}</span>
      </div>
      <div className="hero-body">
        <div className="hero-copy">
          <div className="small-label">今日を一言で</div>
          <h2>{log.oneLineSummary ?? log.title ?? "この日の記録"}</h2>
          {!detail && (
            <Link className="hero-link" href={`/log/${log.date}`}>
              この日のLife Logを読む <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
export function Summary({ log }: { log: LifeLog }) {
  const sections = log.sections.filter((s) => s.kind === "summary");
  if (!sections.length) return null;
  return (
    <section className="summary-section">
      <SectionTitle icon={<Feather size={19} />}>今日の概要</SectionTitle>
      {sections.map((s, i) => (
        <Markdown key={i}>{s.markdown}</Markdown>
      ))}
    </section>
  );
}
export function Findings({ log }: { log: LifeLog }) {
  if (!log.importantFindings.length) return null;
  return (
    <section>
      <SectionTitle icon={<Sparkles size={19} />}>
        今日の重要な発見
      </SectionTitle>
      <div className="findings-grid">
        {log.importantFindings.map((finding, i) => (
          <div key={i} className="finding">
            <span className="finding-number">0{i + 1}</span>
            <p>{finding}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
const categoryGroups = [
  {
    title: "アイデア",
    icon: Lightbulb,
    kinds: ["writingIdeas", "lifeIdeas", "otherIdeas"],
    className: "amber",
  },
  {
    title: "考え・気づき",
    icon: Feather,
    kinds: ["insights"],
    className: "blue",
  },
  { title: "食事・料理", icon: Utensils, kinds: ["meals"], className: "peach" },
  {
    title: "仕事",
    icon: BriefcaseBusiness,
    kinds: ["work"],
    className: "blue",
  },
  {
    title: "日常・人間関係",
    icon: House,
    kinds: ["relationships"],
    className: "green",
  },
  {
    title: "決まったこと",
    icon: Check,
    kinds: ["decisions"],
    className: "green",
  },
  {
    title: "Next Action",
    icon: CircleCheck,
    kinds: ["nextActions"],
    className: "blue",
  },
  {
    title: "未解決・保留",
    icon: Hourglass,
    kinds: ["pending"],
    className: "gray",
  },
];
export function Categories({
  log,
  compact = false,
}: {
  log: LifeLog;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "category-grid" : "detail-sections"}>
      {categoryGroups.map(({ title, icon: Icon, kinds, className }) => {
        const sections = log.sections.filter((s) => kinds.includes(s.kind));
        if (!sections.length) return null;
        return (
          <section
            className={`category-card ${compact ? "compact" : ""}`}
            key={title}
          >
            <SectionTitle
              icon={
                <span className={`category-icon ${className}`}>
                  <Icon size={19} strokeWidth={1.6} />
                </span>
              }
            >
              {title}
            </SectionTitle>
            <div className="category-content">
              {sections.map((s, i) => (
                <div key={i}>
                  {kinds.length > 1 && (
                    <h3 className="subsection-title">
                      {s.kind === "writingIdeas"
                        ? "小説・文章"
                        : s.kind === "lifeIdeas"
                          ? "人生・生活"
                          : "その他のアイデア"}
                    </h3>
                  )}
                  <Markdown>{s.markdown}</Markdown>
                </div>
              ))}
            </div>
            {compact && (
              <Link className="card-more" href={`/log/${log.date}#${kinds[0]}`}>
                続きを読む
                <ArrowUpRight size={14} />
              </Link>
            )}
            {kinds.map((kind) => (
              <span key={kind} id={kind} className="anchor" />
            ))}
          </section>
        );
      })}
    </div>
  );
}
export function ExtraSections({
  log,
  kind,
}: {
  log: LifeLog;
  kind: SectionKind;
}) {
  const sections = log.sections.filter((s) => s.kind === kind);
  if (!sections.length) return null;
  return (
    <section className="category-card">
      <SectionTitle icon={<CalendarDays size={19} />}>
        {kind === "events" ? "今日の出来事" : "その他の記録"}
      </SectionTitle>
      {sections.map((s, i) => (
        <div key={i}>
          {s.title !== "今日の出来事" && (
            <h3 className="subsection-title">{s.title}</h3>
          )}
          <Markdown>{s.markdown}</Markdown>
        </div>
      ))}
    </section>
  );
}
export function Keywords({ log }: { log: LifeLog }) {
  return log.keywords.length ? (
    <section>
      <SectionTitle>検索用キーワード</SectionTitle>
      <div className="tags">
        {log.keywords.map((k, i) => (
          <Link key={i} href={`/search?q=${encodeURIComponent(k)}`}>
            # {k}
          </Link>
        ))}
      </div>
    </section>
  ) : null;
}
export function RecentLogs({ logs }: { logs: LifeLog[] }) {
  return (
    <section>
      <SectionTitle
        icon={<BookOpen size={19} />}
        href="/calendar"
        link="カレンダーを見る"
      >
        最近のLife Log
      </SectionTitle>
      <div className="recent-list">
        {logs.slice(0, 7).map((log) => (
          <Link href={`/log/${log.date}`} className="recent-item" key={log.id}>
            <span className="recent-date">
              <strong>{log.date.slice(8)}</strong>
              <span>{Number(log.date.slice(5, 7))}月</span>
            </span>
            <div>
              <span className="recent-weekday">{formatDate(log.date)}</span>
              <h3>{log.oneLineSummary ?? log.title ?? "この日のLife Log"}</h3>
              <p>{log.summary?.replaceAll("\n", " ")}</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
        ))}
      </div>
    </section>
  );
}
export function MiniCalendar({ logs }: { logs: LifeLog[] }) {
  const month = (logs[0]?.date ?? todayTokyo()).slice(0, 7);
  const recorded = new Set(logs.map((l) => l.date));
  return (
    <section className="rail-card mini-calendar">
      <div className="section-title">
        <h2>
          {Number(month.slice(0, 4))}年 {Number(month.slice(5))}月
        </h2>
        <Link href={`/calendar?month=${month}`} aria-label="月間カレンダーへ">
          <CalendarDays size={17} />
        </Link>
      </div>
      <div className="mini-grid">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <span className="weekday" key={d}>
            {d}
          </span>
        ))}
        {monthGrid(month).map((date, i) =>
          !date ? (
            <span key={i} />
          ) : recorded.has(date) ? (
            <Link
              key={date}
              href={`/log/${date}`}
              className={`recorded ${date === logs[0]?.date ? "latest" : ""}`}
              aria-label={formatDate(date)}
            >
              {Number(date.slice(8))}
              <i />
            </Link>
          ) : (
            <span key={date}>{Number(date.slice(8))}</span>
          ),
        )}
      </div>
      <div className="calendar-key">
        <span className="status-dot" />
        記録のある日
      </div>
    </section>
  );
}
export function HomeRail({ logs }: { logs: LifeLog[] }) {
  const ideas = logs
    .flatMap((log) =>
      [...log.writingIdeas, ...log.lifeIdeas, ...log.otherIdeas].map(
        (text) => ({ date: log.date, text }),
      ),
    )
    .slice(0, 2);
  return (
    <aside className="home-rail">
      <MiniCalendar logs={logs} />
      <section className="rail-card">
        <SectionTitle icon={<Lightbulb size={17} />}>
          最近のアイデア
        </SectionTitle>
        {ideas.map((idea, i) => (
          <Link key={i} className="rail-idea" href={`/log/${idea.date}`}>
            <span>{idea.date.replaceAll("-", " / ")}</span>
            <p>{idea.text.split("\n")[0]}</p>
            <ArrowUpRight size={15} />
          </Link>
        ))}
        <Link href="/ideas" className="text-link">
          すべてのアイデア
          <ArrowRight size={14} />
        </Link>
      </section>
    </aside>
  );
}
