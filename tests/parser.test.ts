import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dateFromFilename, parseLifeLog } from "../lib/parseLifeLog";
import { searchLogs } from "../lib/search";
import { monthGrid, shiftMonth } from "../lib/dates";
const fixture = readFileSync(
  new URL("../fixtures/Lifelog_20260924.md", import.meta.url),
  "utf8",
);
const log = parseLifeLog("fixture", "Lifelog_20260924.md", fixture);
test("only valid daily filenames are accepted (including leap days)", () => {
  assert.equal(dateFromFilename("Lifelog_20260924.md"), "2026-09-24");
  for (const value of [
    "Lifelog_20260229.md",
    "Lifelog_20261301.md",
    "Lifelog_20260931.md",
    "Lifelog_20260924_1200.md",
    "other.md",
    "Lifelog_20260924.md.txt",
  ])
    assert.equal(dateFromFilename(value), null);
  assert.equal(dateFromFilename("Lifelog_20240229.md"), "2024-02-29");
});
test("real-world numbered emoji headings, nested ideas and hard line breaks", () => {
  assert.equal(log.writingIdeas.length, 1);
  assert.match(log.writingIdeas[0], /小さな図書館の物語\n失くした/);
  assert.equal(log.lifeIdeas.length, 1);
  assert.equal(log.otherIdeas.length, 0);
  assert.equal(log.events[0].time, "7:33");
  assert.equal(log.events[0].period, "朝");
  assert.match(log.events[0].text, /公園を散歩/);
  assert.equal(log.importantFindings.length, 2);
  assert.equal(log.oneLineSummary, "ゆっくりと、自分のペースで。");
});
test("Next Action keeps title, due date, checkbox state and metadata separate", () => {
  assert.equal(log.nextActions.length, 2);
  assert.equal(log.nextActions[0].text, "図書館の開館時間を調べる");
  assert.equal(log.nextActions[0].due, "週末");
  assert.equal(log.nextActions[0].completed, false);
  assert.match(log.nextActions[0].details!, /読書、図書館/);
  assert.equal(log.nextActions[1].completed, true);
  assert.equal(log.decisions.length, 1);
});
test("empty sections disappear, unknown sections and original source survive", () => {
  assert.equal(log.work.length, 0);
  assert.equal(log.relationships.length, 0);
  assert.equal(
    log.sections.some((s) => s.kind === "work"),
    false,
  );
  const raw =
    "\uFEFF# 日記\n\n## 今日の概要\n穏やかな日。\n\n## 新しいセクション\n消してはいけないメモ\n\n## 食事\n- なし";
  const other = parseLifeLog("x", "Lifelog_20260925.md", raw);
  assert.equal(other.rawMarkdown, raw);
  assert.equal(other.summary, "穏やかな日。");
  assert.ok(
    other.sections.find(
      (s) => s.kind === "other" && s.text.includes("消してはいけない"),
    ),
  );
  assert.equal(other.meals.length, 0);
});
test("headings inside fenced code do not become sections; setext headings work", () => {
  const other = parseLifeLog(
    "x",
    "Lifelog_20260925.md",
    "今日の概要\n==========\nテスト\n\n```md\n## 仕事\ncode\n```\n\n食事・料理\n----------\nスープ",
  );
  assert.equal(other.work.length, 0);
  assert.equal(other.meals[0], "スープ");
});
test("full text search supports Japanese AND queries, width normalization, dates, empty and missing terms", () => {
  assert.equal(searchLogs([log], "図書館 読書").length, 1);
  assert.equal(searchLogs([log], "２０２６-０９-２４").length, 1);
  assert.equal(searchLogs([log], "2026/09/24").length, 1);
  assert.equal(searchLogs([log], "").length, 0);
  assert.equal(searchLogs([log], "図書館 未記録").length, 0);
  assert.match(searchLogs([log], "図書館")[0].snippet, /図書館/);
});
test("calendar aligns weekdays, leap years and year boundaries", () => {
  const september = monthGrid("2026-09");
  assert.equal(september[0], null);
  assert.equal(september[2], "2026-09-01");
  assert.equal(september.filter(Boolean).length, 30);
  assert.equal(monthGrid("2024-02").filter(Boolean).length, 29);
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
});
