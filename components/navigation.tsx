"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  House,
  CalendarDays,
  Search,
  Lightbulb,
  CircleCheck,
  Settings,
  LockKeyhole,
} from "lucide-react";
const links = [
  ["/", "Home", "ホーム", House],
  ["/calendar", "Calendar", "カレンダー", CalendarDays],
  ["/search", "Search", "検索", Search],
  ["/ideas", "Ideas", "アイデア", Lightbulb],
  ["/next-actions", "Next Actions", "やること", CircleCheck],
  ["/settings", "Settings", "設定", Settings],
] as const;
export function Navigation({ demo }: { demo: boolean }) {
  const path = usePathname();
  return (
    <>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <BookOpen size={23} />
          </span>
          <span>Life Log</span>
        </Link>
        <nav aria-label="メインナビゲーション">
          {links.map(([href, , label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${path === href || (href === "/" && path.startsWith("/log/")) ? "active" : ""}`}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.6} />
              {label}
              {path === href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="private-label">
            <LockKeyhole size={13} />
            {demo ? "デモモード" : "非公開"}
          </div>
        </div>
      </aside>
      <header className="mobile-header">
        <Link href="/" className="brand">
          <BookOpen size={22} /> Life Log
        </Link>
        <Link href="/settings" aria-label="設定">
          <Settings size={21} />
        </Link>
      </header>
      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {links.slice(0, 5).map(([href, , label, Icon]) => (
          <Link
            key={href}
            href={href}
            className={path === href ? "active" : ""}
            aria-current={path === href ? "page" : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
