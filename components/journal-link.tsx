"use client";
import NextLink from "next/link";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";
import { journalHref } from "@/lib/journalPaths";
const BasePathContext = createContext<"" | "/demo">("");
export function DemoNavigationScope({ children }: { children: ReactNode }) {
  return (
    <BasePathContext.Provider value="/demo">
      {children}
    </BasePathContext.Provider>
  );
}
export const useJournalBasePath = () => useContext(BasePathContext);
export default function JournalLink({
  href,
  ...props
}: Omit<ComponentProps<typeof NextLink>, "href"> & { href: string }) {
  const basePath = useJournalBasePath();
  return <NextLink {...props} href={journalHref(href, basePath)} />;
}

// Demo Markdown is text-only for links, including future fixture edits.
export function JournalMarkdownLink({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  const basePath = useJournalBasePath();
  return basePath ? (
    <span>{children}</span>
  ) : (
    <a href={href} rel="noreferrer noopener" target="_blank">
      {children}
    </a>
  );
}
