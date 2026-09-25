import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { getLifeLogs } from "@/lib/lifeLogs";
import { searchLogs } from "@/lib/search";
import { formatDate } from "@/lib/dates";
import { Highlight } from "@/components/highlight";
import { PageHeading, DataState } from "@/components/journal";
export const metadata = { title: "Search" };
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const collection = await getLifeLogs();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const results = searchLogs(collection.logs, q);
  const keywords = [
    ...new Set(collection.logs.flatMap((l) => l.keywords)),
  ].slice(0, 8);
  return (
    <div className="reading-width">
      <PageHeading
        title="検索"
        description="すべての日次記録をキーワードや日付で検索します。"
      />
      <form className="search-form" action="/search" role="search">
        <Search size={21} />
        <input
          name="q"
          defaultValue={q}
          aria-label="Life Logを全文検索"
          placeholder="気になる言葉や日付を入力…"
          maxLength={200}
        />
        <button className="button primary" type="submit">
          検索
        </button>
      </form>
      <p className="search-hint">
        日本語・日付で検索できます。スペースで区切ると、すべての言葉を含む日を探します。
      </p>
      {collection.state !== "ready" || !collection.logs.length ? (
        <DataState collection={collection} />
      ) : !q ? (
        <section className="search-welcome">
          <Search size={34} strokeWidth={1.2} />
          <h2>最近のキーワード</h2>

          <div className="tags">
            {keywords.map((k) => (
              <Link href={`/search?q=${encodeURIComponent(k)}`} key={k}>
                # {k}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <>
          <div className="results-count">
            「{q}」を含む記録 <strong>{results.length}</strong> 件
          </div>
          {results.length ? (
            <div className="search-results">
              {results.map(({ log, title, snippet }) => (
                <Link
                  href={`/log/${log.date}`}
                  className="search-result"
                  key={log.id}
                >
                  <span className="eyebrow">{formatDate(log.date, false)}</span>
                  <h2>{title.replace(/^\d+[.．]\s*/, "")}</h2>
                  <p>
                    <Highlight text={snippet} query={q} />
                  </p>
                  <span className="text-link">
                    この日のLife Logを見る
                    <ArrowUpRight size={15} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={30} />
              <h2>一致する記録がありませんでした</h2>
              <p>短い言葉に変えるか、別のキーワードで探してみてください。</p>
              <Link href="/search" className="button">
                検索をクリア
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
