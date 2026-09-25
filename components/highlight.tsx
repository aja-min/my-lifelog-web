import { normalize } from "@/lib/search";
// Keep an index map so width normalization never corrupts Japanese source text.
export function Highlight({ text, query }: { text: string; query: string }) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  let folded = "";
  const offsets: number[] = [];
  let offset = 0;
  for (const char of text) {
    const part = normalize(char);
    for (let i = 0; i < part.length; i++) offsets.push(offset);
    folded += part;
    offset += char.length;
  }
  offsets.push(text.length);
  const marked = new Set<number>();
  for (const term of terms) {
    let start = folded.indexOf(term);
    while (start !== -1) {
      for (
        let i = offsets[start];
        i < (offsets[start + term.length] ?? text.length);
        i++
      )
        marked.add(i);
      start = folded.indexOf(term, start + Math.max(term.length, 1));
    }
  }
  const chunks: { value: string; mark: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const mark = marked.has(i);
    if (chunks.at(-1)?.mark === mark)
      chunks[chunks.length - 1].value += text[i];
    else chunks.push({ value: text[i], mark });
  }
  return (
    <>
      {chunks.map((chunk, i) =>
        chunk.mark ? <mark key={i}>{chunk.value}</mark> : chunk.value,
      )}
    </>
  );
}
