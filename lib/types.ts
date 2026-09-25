export type SectionKind =
  | "summary"
  | "events"
  | "writingIdeas"
  | "lifeIdeas"
  | "otherIdeas"
  | "insights"
  | "meals"
  | "work"
  | "relationships"
  | "decisions"
  | "nextActions"
  | "pending"
  | "keywords"
  | "importantFindings"
  | "oneLineSummary"
  | "other";
export type LogSection = {
  kind: SectionKind;
  title: string;
  markdown: string;
  text: string;
};
export type LifeLogEvent = { text: string; period?: string; time?: string };
export type NextAction = {
  text: string;
  completed: boolean;
  due?: string;
  details?: string;
};
export type LifeLog = {
  id: string;
  date: string;
  title?: string;
  summary?: string;
  oneLineSummary?: string;
  events: LifeLogEvent[];
  writingIdeas: string[];
  lifeIdeas: string[];
  otherIdeas: string[];
  insights: string[];
  meals: string[];
  work: string[];
  relationships: string[];
  decisions: string[];
  nextActions: NextAction[];
  pending: string[];
  keywords: string[];
  importantFindings: string[];
  sections: LogSection[];
  rawMarkdown: string;
};
