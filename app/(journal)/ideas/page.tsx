import Link from "next/link";
import { ArrowUpRight, BookOpen, Sprout, Lightbulb } from "lucide-react";
import { getLifeLogs } from "@/lib/lifeLogs";
import { PageHeading, DataState } from "@/components/journal";
export const metadata = { title: "Ideas" };
const kinds = [
  { key: "writingIdeas", label: "小説・文章", icon: BookOpen, style: "amber" },
  { key: "lifeIdeas", label: "人生・生活", icon: Sprout, style: "green" },
  { key: "otherIdeas", label: "その他", icon: Lightbulb, style: "blue" },
] as const;
export default async function Ideas({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const collection = await getLifeLogs();
  const { type } = await searchParams;
  const selected = kinds.some((k) => k.key === type) ? type : undefined;
  const ideas = collection.logs
    .flatMap((log) =>
      kinds.flatMap((kind) =>
        log[kind.key].map((text, index) => ({ log, kind, text, index })),
      ),
    )
    .filter((i) => !selected || i.kind.key === selected);
  return (
    <>
      <PageHeading
        title="アイデア"
        description="日次記録に含まれるアイデアの一覧です。"
      />
      <nav className="filter-tabs" aria-label="アイデアの種類">
        <Link className={!selected ? "selected" : ""} href="/ideas">
          すべて
        </Link>
        {kinds.map((k) => (
          <Link
            key={k.key}
            className={selected === k.key ? "selected" : ""}
            href={`/ideas?type=${k.key}`}
          >
            {k.label}
          </Link>
        ))}
        <span>{ideas.length} ideas</span>
      </nav>
      {collection.state !== "ready" || !collection.logs.length ? (
        <DataState collection={collection} />
      ) : ideas.length ? (
        <div className="ideas-grid">
          {ideas.map(({ log, kind, text, index }) => (
            <Link
              className="idea-card"
              href={`/log/${log.date}#${kind.key}`}
              key={`${log.id}-${kind.key}-${index}`}
            >
              <div className="idea-top">
                <span className={`idea-kind ${kind.style}`}>
                  <kind.icon size={15} />
                  {kind.label}
                </span>
                <span>{log.date.replaceAll("-", " / ")}</span>
              </div>
              <h2>{text.split("\n")[0]}</h2>
              {text.includes("\n") && (
                <p>{text.split("\n").slice(1).join("\n")}</p>
              )}
              <span className="idea-bottom">
                この日の記録へ
                <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Lightbulb />
          <h2>該当するアイデアがありません</h2>
          <p>この種類のアイデアが記録されると、ここに並びます。</p>
        </div>
      )}
    </>
  );
}
