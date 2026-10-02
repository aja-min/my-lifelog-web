"use client";
export default function DemoError({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h2>デモを読み込めませんでした</h2>
      <button className="button" onClick={reset}>
        再読み込み
      </button>
    </div>
  );
}
