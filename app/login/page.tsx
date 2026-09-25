import Link from "next/link";
import { BookOpen, LockKeyhole } from "lucide-react";
import { authConfigured, demoEnabled } from "@/lib/auth";
import { LoginButton } from "@/components/auth-buttons";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="login-page">
      <div className="login-brand">
        <BookOpen size={24} />
        Life Log
      </div>
      <section className="login-card">
        <h1>ログイン</h1>
        <p>Life Logを閲覧するにはGoogleアカウントでログインしてください。</p>
        {error && (
          <div className="login-error" role="alert">
            ログインできませんでした。許可されたGoogleアカウントで、もう一度お試しください。
          </div>
        )}
        {authConfigured() ? (
          <LoginButton />
        ) : (
          <div className="setup-notice">
            <h2>ログイン設定が必要です</h2>
            <p>
              READMEに沿ってGoogle認証と環境変数を設定してください。設定が完了するまで、記録は公開されません。
            </p>
          </div>
        )}
        {demoEnabled() && (
          <Link className="button" href="/">
            架空データのデモを開く
          </Link>
        )}
        <div className="login-private">
          <LockKeyhole size={14} />
          許可されたアカウントだけが閲覧できます
        </div>
      </section>
    </main>
  );
}
