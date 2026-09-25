import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state not-found">
      <h1>このページは見つかりませんでした</h1>
      <p>日付が正しいか、記録が存在するかを確認してください。</p>
      <Link className="button primary" href="/">
        Homeに戻る
      </Link>
    </main>
  );
}
