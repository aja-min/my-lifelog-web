import { JournalMarkdownLink } from "./journal-link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          img: () => null,
          a: JournalMarkdownLink,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
