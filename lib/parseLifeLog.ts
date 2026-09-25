import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { toString } from "mdast-util-to-string";
import type { RootContent, Nodes } from "mdast";
import type { LifeLog, SectionKind } from "./types";

const parser = unified().use(remarkParse).use(remarkGfm);
export function dateFromFilename(name: string): string | null {
  const m = /^Lifelog_(\d{4})(\d{2})(\d{2})\.md$/.exec(name);
  if (!m) return null;
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
    ? date
    : null;
}
export const isEmptyText = (s: string) =>
  /^(?:なし|特になし|該当なし|該当する情報なし|記録なし|情報なし|ありません|n\/?a|none|[-—–])(?:[。.!！])?$/i.test(
    s.trim(),
  ) || !s.trim();
export function sectionKind(title: string): SectionKind | undefined {
  const t = title.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
  if (/今日を一言|一言まとめ|一言で/.test(t)) return "oneLineSummary";
  if (/重要な発見/.test(t)) return "importantFindings";
  if (/概要|サマリー/.test(t)) return "summary";
  if (/出来事|タイムライン/.test(t)) return "events";
  if (/小説|文章|創作/.test(t) && /アイデア|ひらめき/.test(t))
    return "writingIdeas";
  if (/人生|生活/.test(t) && /アイデア|ひらめき/.test(t)) return "lifeIdeas";
  if (/アイデア|ひらめき/.test(t)) return "otherIdeas";
  // Combined container headings inherit into their more specific subheadings.
  if (/nextactions?|次のアクション|やること/.test(t)) return "nextActions";
  if (/決まったこと|決定事項/.test(t)) return "decisions";
  if (/気づき|気付き|考え/.test(t)) return "insights";
  if (/食事|料理/.test(t)) return "meals";
  if (/仕事/.test(t)) return "work";
  if (/人間関係|日常/.test(t)) return "relationships";
  if (/未解決|保留/.test(t)) return "pending";
  if (/キーワード|タグ/.test(t)) return "keywords";
}
function readable(node: Nodes): string {
  if (node.type === "break") return "\n";
  if ("children" in node) {
    const separator = ["list", "listItem", "root", "blockquote"].includes(
      node.type,
    )
      ? "\n"
      : "";
    return node.children
      .map((child) => readable(child as Nodes))
      .join(separator);
  }
  return toString(node);
}
function items(nodes: RootContent[]): string[] {
  return nodes
    .flatMap((node) =>
      node.type === "list"
        ? node.children.map((item) => readable(item))
        : [readable(node)],
    )
    .map((s) => s.trim())
    .filter((s) => !isEmptyText(s));
}
export function parseLifeLog(
  id: string,
  name: string,
  rawMarkdown: string,
): LifeLog {
  const date = dateFromFilename(name);
  if (!date) throw new Error("Invalid daily Life Log filename");
  const log: LifeLog = {
    id,
    date,
    rawMarkdown,
    sections: [],
    events: [],
    writingIdeas: [],
    lifeIdeas: [],
    otherIdeas: [],
    insights: [],
    meals: [],
    work: [],
    relationships: [],
    decisions: [],
    nextActions: [],
    pending: [],
    keywords: [],
    importantFindings: [],
  };
  const tree = parser.parse(rawMarkdown.replace(/^\uFEFF/, ""));
  // Positions refer to this normalized source, never the original BOM-prefixed string.
  const source = rawMarkdown.replace(/^\uFEFF/, "");
  const stack: { depth: number; kind: SectionKind; title: string }[] = [];
  let buffer: RootContent[] = [];
  const flush = () => {
    const current = stack.at(-1) ?? { kind: "other" as const, title: "メモ" };
    const values = items(buffer);
    if (!values.length) {
      buffer = [];
      return;
    }
    const markdown = buffer
      .map((n) =>
        source.slice(n.position?.start.offset, n.position?.end.offset),
      )
      .join("\n\n");
    const text = values.join("\n\n");
    log.sections.push({
      kind: current.kind,
      title: current.title,
      markdown,
      text,
    });
    const kind = current.kind;
    if (kind === "summary" || kind === "oneLineSummary")
      log[kind] = [log[kind], text].filter(Boolean).join("\n\n");
    else if (kind === "events")
      log.events.push(
        ...values.map((text) => ({
          text,
          period: current.title,
          time: text.match(/\d{1,2}:\d{2}(?:ごろ)?/)?.[0],
        })),
      );
    else if (kind === "nextActions") {
      for (const node of buffer) {
        const entries = node.type === "list" ? node.children : [node];
        for (const entry of entries) {
          const full = readable(entry).trim();
          if (isEmptyText(full)) continue;
          const lines = full.split("\n").map((s) => s.trim());
          const first = lines[0].replace(/^(?:やること|タスク)\s*[:：]\s*/, "");
          const due = lines
            .find((s) => /^期限\s*[:：]/.test(s))
            ?.replace(/^期限\s*[:：]\s*/, "");
          log.nextActions.push({
            text: first,
            completed: entry.type === "listItem" && entry.checked === true,
            due: due && !isEmptyText(due) ? due : undefined,
            details:
              lines
                .slice(1)
                .filter((s) => !/^(?:期限|関係する人)\s*[:：]\s*なし$/.test(s))
                .join("\n") || undefined,
          });
        }
      }
    } else if (kind === "keywords")
      log.keywords.push(
        ...values
          .flatMap((v) => v.split(/[,、，\n]/))
          .map((s) => s.replace(/^#/, "").trim())
          .filter(Boolean),
      );
    else if (kind !== "other") log[kind].push(...values);
    buffer = [];
  };
  for (const node of tree.children) {
    if (node.type !== "heading") {
      if (node.type !== "thematicBreak") buffer.push(node);
      continue;
    }
    flush();
    const title = toString(node);
    while (stack.length && stack.at(-1)!.depth >= node.depth) stack.pop();
    const ownKind = sectionKind(title);
    if (node.depth === 1 && !ownKind && !log.title) log.title = title;
    stack.push({
      depth: node.depth,
      kind: ownKind ?? stack.at(-1)?.kind ?? "other",
      title,
    });
  }
  flush();
  return log;
}
