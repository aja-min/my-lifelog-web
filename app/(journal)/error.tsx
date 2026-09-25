"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>記録を開けませんでした</h1>
      <p>少し待って、もう一度お試しください。</p>
      <button className="button" onClick={reset}>
        再試行する
      </button>
    </div>
  );
}
