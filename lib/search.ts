import type { LifeLog } from "./types";
export const normalize = (s: string) =>
  s.normalize("NFKC").toLocaleLowerCase("ja-JP");
export function searchLogs(logs: LifeLog[], query: string) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return logs.flatMap((log) => {
    const haystack = normalize(
      `${log.date} ${log.date.replaceAll("-", "/")} ${log.date.replaceAll("-", "")} ${log.rawMarkdown}`,
    );
    if (!terms.every((term) => haystack.includes(term))) return [];
    const section = log.sections.find((s) =>
      terms.some((term) => normalize(s.text).includes(term)),
    );
    const text = section?.text ?? log.summary ?? log.rawMarkdown;
    const index = Math.max(
      0,
      ...terms
        .map((t) => normalize(text).indexOf(t))
        .filter((i) => i >= 0)
        .slice(0, 1),
    );
    const start = Math.max(0, index - 55);
    return [
      {
        log,
        title: section?.title ?? "日付・本文",
        snippet:
          (start ? "…" : "") +
          text.slice(start, start + 220) +
          (text.length > start + 220 ? "…" : ""),
      },
    ];
  });
}
