import { Navigation } from "@/components/navigation";
import { DemoNavigationScope } from "@/components/journal-link";
export const metadata = { title: "Demo Life Log" };
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoNavigationScope>
      <a href="#main-content" className="skip-link">
        本文へ移動
      </a>
      <Navigation demo />
      <div className="app-body">
        <div className="demo-banner">
          <strong>DEMO</strong> · 公開用の架空データです。
        </div>
        <main id="main-content" className="main-content">
          {children}
        </main>
      </div>
    </DemoNavigationScope>
  );
}
