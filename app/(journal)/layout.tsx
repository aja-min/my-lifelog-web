import { requireUser } from "@/lib/auth";
import { Navigation } from "@/components/navigation";
export const dynamic = "force-dynamic";
export default async function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <>
      <a href="#main-content" className="skip-link">
        本文へ移動
      </a>
      <Navigation demo={user.demo} />
      <div className="app-body">
        {user.demo && (
          <div className="demo-banner">
            デモモード：架空データを表示しています。
          </div>
        )}
        <main id="main-content" className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}
