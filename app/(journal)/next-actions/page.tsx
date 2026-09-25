import Link from "next/link";
import { ArrowUpRight, Square, SquareCheck, CircleCheck } from "lucide-react";
import { getLifeLogs } from "@/lib/lifeLogs";
import { formatDate } from "@/lib/dates";
import { PageHeading, DataState } from "@/components/journal";
export const metadata = { title: "Next Actions" };
export default async function NextActions() {
  const collection = await getLifeLogs();
  const days = collection.logs.filter((l) => l.nextActions.length);
  const count = days.reduce((n, day) => n + day.nextActions.length, 0);
  return (
    <div className="reading-width">
      <PageHeading
        title="Next Actions"
        description="日次記録に含まれるアクションを日付順に表示します。"
      />
      <div className="actions-note">
        <CircleCheck size={18} />
        <span>{count}件のアクション</span>
        <span className="muted">
          記録の閲覧専用 · 完了状態は元のMarkdownに基づきます
        </span>
      </div>
      {collection.state !== "ready" || !collection.logs.length ? (
        <DataState collection={collection} />
      ) : days.length ? (
        <div className="action-days">
          {days.map((log) => (
            <section key={log.id}>
              <h2 className="action-day">{formatDate(log.date)}</h2>
              <div className="action-list">
                {log.nextActions.map((action, i) => (
                  <div className="action-item" key={i}>
                    <span
                      className="action-check"
                      aria-label={
                        action.completed
                          ? "完了（元の記録）"
                          : "未完了（閲覧専用）"
                      }
                    >
                      {action.completed ? (
                        <SquareCheck size={21} />
                      ) : (
                        <Square size={21} />
                      )}
                    </span>
                    <div>
                      <h3 className={action.completed ? "completed" : ""}>
                        {action.text}
                      </h3>
                      {action.due && (
                        <span className="due">期限：{action.due}</span>
                      )}
                      {action.details && (
                        <details className="action-details">
                          <summary>補足情報</summary>
                          <p>{action.details}</p>
                        </details>
                      )}
                      <Link
                        className="action-source"
                        href={`/log/${log.date}#nextActions`}
                      >
                        この日のLife Logを見る
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CircleCheck />
          <h2>アクションがありません</h2>
          <p>Next Actionが記録されると、ここに表示されます。</p>
        </div>
      )}
    </div>
  );
}
