import Link from "@/components/journal-link";
export default function DemoNotFound() {
  return (
    <div className="empty-state">
      <h1>デモの記録が見つかりません</h1>
      <p>カレンダーから日付を選択してください。</p>
      <Link className="button" href="/demo/calendar">
        デモのカレンダーへ
      </Link>
    </div>
  );
}
