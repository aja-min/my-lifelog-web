import { ShieldCheck, Database, RefreshCw, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { driveConfigured } from "@/lib/googleDrive";
import { PageHeading } from "@/components/journal";
import { LogoutButton } from "@/components/auth-buttons";
export const metadata = { title: "Settings" };
export default async function Settings() {
  const user = await requireUser();
  return (
    <div className="reading-width">
      <PageHeading
        title="設定"
        description="Google Driveの接続状況とログイン情報を確認できます。"
      />
      <div className="settings-stack">
        <section className="settings-card">
          <h2>
            <ShieldCheck size={20} />
            プライバシーとログイン
          </h2>
          <p>
            {user.demo
              ? "ローカル開発用デモを表示しています。本番ではGoogleログインが必須です。"
              : "許可されたGoogleアカウントのみ、このジャーナルを閲覧できます。"}
          </p>
          <div className="setting-row">
            <span>ログイン中</span>
            <strong>{user.email}</strong>
          </div>
          {!user.demo && <LogoutButton />}
        </section>
        <section className="settings-card">
          <h2>
            <Database size={20} />
            Google Drive
          </h2>
          <div className="setting-row">
            <span>接続設定</span>
            <span className="pill">
              {user.demo
                ? "デモモード"
                : driveConfigured()
                  ? "設定済み"
                  : "未設定"}
            </span>
          </div>
          <div className="setting-row">
            <span>対象フォルダ</span>
            <strong>Lifelog AI - 1日の要約</strong>
          </div>
          <div className="setting-row">
            <span>対象ファイル</span>
            <code>Lifelog_YYYYMMDD.md</code>
          </div>
          <p>
            このフォルダ直下の日次Markdownのみを読み取ります。音声や時間指定の記録は読み込みません。接続情報はサーバーの環境変数で設定してください。
          </p>
          <p className="small muted">
            設定済みの表示は疎通の確認結果ではありません。接続に失敗した場合はHomeに案内が表示されます。
          </p>
        </section>
        <section className="settings-card">
          <h2>
            <RefreshCw size={20} />
            記録の更新
          </h2>
          <p>
            ファイル一覧は5分間キャッシュします。次のアクセス時に再確認し、追加・変更された記録を取得します。期限直後のアクセスでは、更新が次の再読み込みに反映される場合があります。
          </p>
          <p>
            このアプリは閲覧専用です。編集や完了状態の変更、Google
            Driveへの書き込みは行いません。
          </p>
        </section>
        <a
          className="text-link"
          href="https://drive.google.com/drive/my-drive"
          target="_blank"
          rel="noreferrer"
        >
          Google Driveを開く
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
