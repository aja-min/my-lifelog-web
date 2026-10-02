import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { parseLifeLog } from "../lib/parseLifeLog";
import { searchLogs } from "../lib/search";
import { journalHref } from "../lib/journalPaths";
const names = readdirSync("data/demo")
  .filter((n) => n.endsWith(".md"))
  .sort();
const logs = names.map((n) =>
  parseLifeLog(`public-demo-${n}`, n, readFileSync(`data/demo/${n}`, "utf8")),
);
test("nine local fictional days use the existing parser, including all three idea categories", () => {
  assert.equal(logs.length, 9);
  for (const log of logs) {
    assert.ok(log.summary && log.oneLineSummary);
    assert.equal(log.events.length, 2);
    assert.ok(
      log.writingIdeas.length && log.lifeIdeas.length && log.otherIdeas.length,
    );
    assert.equal(log.nextActions.length, 1);
    assert.ok(log.nextActions[0].due);
    assert.equal(log.importantFindings.length, 2);
    assert.ok(log.keywords.length >= 5);
    assert.doesNotMatch(
      log.rawMarkdown,
      /https?:\/\/|[\w.-]+@[\w.-]+|PRIVATE KEY|GOCSPX/,
    );
  }
  assert.equal(logs[4].work.length, 0);
  assert.match(logs[0].summary!, /陶芸/);
  assert.match(logs.at(-1)!.summary!, /鉢皿/);
});
test("LT keywords find multiple days; unknown queries do not fall back to another data source", () => {
  for (const q of ["陶芸", "ハーブ", "刺繍", "星座"])
    assert.ok(searchLogs(logs, q).length >= 3, q);
  assert.equal(searchLogs(logs, "存在しないキーワード").length, 0);
});
test("demo navigation scopes queries/fragments and blocks private, API and external destinations", () => {
  for (const [href, expected] of [
    ["/", "/demo"],
    ["/calendar?month=2026-09", "/demo/calendar?month=2026-09"],
    ["/log/2026-09-22#writingIdeas", "/demo/log/2026-09-22#writingIdeas"],
    ["/demo/search?q=AI", "/demo/search?q=AI"],
  ])
    assert.equal(journalHref(href, "/demo"), expected);
  for (const href of [
    "/api/auth/session",
    "/login",
    "//evil.test",
    "https://evil.test",
    "/demo/../settings",
    "/log/../../api",
    "javascript:alert(1)",
  ])
    assert.equal(journalHref(href, "/demo"), "/demo");
  assert.equal(journalHref("/log/2026-09-22", ""), "/log/2026-09-22");
});
test("demo import graph cannot reach production repositories, OAuth, env or network clients", () => {
  const visited = new Set<string>();
  function visit(file: string) {
    file = path.resolve(file);
    if (visited.has(file)) return;
    visited.add(file);
    assert.doesNotMatch(file, /lib\/(auth|googleDrive|lifeLogs)\.ts$/);
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /process\.env|\bfetch\s*\(/, file);
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const imports: string[] = [];
    function inspect(n: ts.Node) {
      if (
        ts.isImportDeclaration(n) &&
        !n.importClause?.isTypeOnly &&
        ts.isStringLiteral(n.moduleSpecifier)
      )
        imports.push(n.moduleSpecifier.text);
      if (
        ts.isExportDeclaration(n) &&
        !n.isTypeOnly &&
        n.moduleSpecifier &&
        ts.isStringLiteral(n.moduleSpecifier)
      )
        imports.push(n.moduleSpecifier.text);
      if (
        ts.isCallExpression(n) &&
        n.expression.kind === ts.SyntaxKind.ImportKeyword
      )
        assert.fail("Dynamic imports require boundary review: " + file);
      ts.forEachChild(n, inspect);
    }
    inspect(ast);
    for (const item of imports) {
      assert.doesNotMatch(
        item,
        /next-auth|google-auth|googleapis|node:https?|axios/,
      );
      if (!item.startsWith(".") && !item.startsWith("@/")) continue;
      const base = item.startsWith("@/")
        ? path.resolve(item.slice(2))
        : path.resolve(path.dirname(file), item);
      const target = [
        base,
        base + ".ts",
        base + ".tsx",
        base + "/index.ts",
      ].find((f) => existsSync(f));
      assert.ok(target, item);
      visit(target);
    }
  }
  for (const f of [
    "app/demo/layout.tsx",
    "app/demo/[[...path]]/page.tsx",
    "app/demo/not-found.tsx",
    "app/demo/error.tsx",
  ])
    visit(f);
  assert.ok([...visited].some((f) => f.endsWith("/parseLifeLog.ts")));
});
test("actual demo repository runs without Google environment variables and with network disabled", () => {
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (/GOOGLE|NEXTAUTH|ALLOWED_EMAIL|DEMO_MODE/.test(key)) delete env[key];
  const result = spawnSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      `globalThis.fetch = () => { throw new Error('Network forbidden'); }; const { getDemoLifeLogs } = await import('./lib/demoRepository.ts'); const c = await getDemoLifeLogs(); if (c.logs.length !== 9 || !c.demo || c.state !== 'ready') throw new Error('Bad demo'); console.log('ok');`,
    ],
    { encoding: "utf8", env },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ok/);
});
