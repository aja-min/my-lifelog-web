import { notFound } from "next/navigation";
import { getDemoLifeLogs } from "@/lib/demoRepository";
import Home from "@/components/views/home";
import Calendar from "@/components/views/calendar";
import Ideas from "@/components/views/ideas";
import Search from "@/components/views/search";
import NextActions from "@/components/views/next-actions";
import Log from "@/components/views/log";
import { PageHeading } from "@/components/journal";
export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ month?: string; type?: string; q?: string }>;
}) {
  const segments = (await params).path ?? [];
  const route = segments.join("/");
  const collection = await getDemoLifeLogs();
  if (!route) return <Home collection={collection} />;
  if (route === "calendar")
    return <Calendar collection={collection} searchParams={searchParams} />;
  if (route === "ideas")
    return <Ideas collection={collection} searchParams={searchParams} />;
  if (route === "search")
    return (
      <Search
        collection={collection}
        searchParams={searchParams}
        basePath="/demo"
      />
    );
  if (route === "next-actions") return <NextActions collection={collection} />;
  if (route === "settings")
    return (
      <div className="reading-width">
        <PageHeading title="デモについて" />
        <section className="settings-card">
          <h2>公開デモ</h2>
          <p>
            すべての記録は発表用に作成した架空の内容です。ログインは不要です。
          </p>
          <p>
            ローカルのMarkdownを使用しており、Google
            Driveや本番の記録にはアクセスしません。
          </p>
          <div className="setting-row">
            <span>記録数</span>
            <strong>{collection.logs.length}日分</strong>
          </div>
          <div className="setting-row">
            <span>期間</span>
            <span>
              {collection.logs.at(-1)?.date} ～ {collection.logs[0]?.date}
            </span>
          </div>
        </section>
      </div>
    );
  if (segments.length === 2 && segments[0] === "log")
    return <Log collection={collection} date={segments[1]} />;
  notFound();
}
