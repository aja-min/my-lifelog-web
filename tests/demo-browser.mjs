import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3100";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const badRequests = [];
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await context.route("**/*", (route) => {
  const u = new URL(route.request().url());
  const ok =
    u.origin === new URL(base).origin &&
    (u.pathname === "/demo" ||
      u.pathname.startsWith("/demo/") ||
      u.pathname.startsWith("/_next/") ||
      u.pathname === "/icon.svg");
  if (!ok) {
    badRequests.push(u.pathname);
    return route.abort();
  }
  return route.continue();
});
async function audit() {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  for (const href of await page
    .locator("a[href]")
    .evaluateAll((es) => es.map((e) => e.getAttribute("href"))))
    assert.ok(href.startsWith("/demo") || href.startsWith("#"), href);
  for (const action of await page
    .locator("form[action]")
    .evaluateAll((es) => es.map((e) => e.getAttribute("action"))))
    assert.ok(action.startsWith("/demo"), action);
  assert.equal(
    await page.getByRole("button", { name: "Googleでログイン" }).count(),
    0,
  );
}
try {
  await page.goto(base + "/demo", { waitUntil: "networkidle" });
  await audit();
  assert.match(await page.locator(".hero-copy").innerText(), /鶏そぼろ/);
  await page.screenshot({
    path: "/tmp/lifelog-public-demo-desktop.png",
    fullPage: true,
  });
  await page
    .locator(".sidebar")
    .getByRole("link", { name: "カレンダー", exact: true })
    .click();
  await page.waitForURL("**/demo/calendar");
  assert.equal(await page.locator(".month-cell a").count(), 9);
  await audit();
  await page.getByRole("link", { name: "前月", exact: true }).click();
  await page.waitForURL("**month=2026-08");
  assert.equal(await page.locator(".month-cell a").count(), 0);
  await page.getByRole("link", { name: "記録月", exact: true }).click();
  await page.waitForURL("**month=2026-09");
  await page.locator(".month-cell a").first().click();
  await page.waitForURL("**/demo/log/2026-09-22");
  await audit();
  await page.getByText("Raw Markdownを見る").click();
  assert.match(await page.locator(".raw-markdown pre").innerText(), /陶芸/);
  await page
    .locator(".sidebar")
    .getByRole("link", { name: "アイデア", exact: true })
    .click();
  await page.waitForURL("**/demo/ideas");
  assert.equal(await page.locator(".idea-card").count(), 27);
  await page.getByRole("link", { name: "その他", exact: true }).click();
  await page.waitForURL("**type=otherIdeas");
  assert.equal(await page.locator(".idea-card").count(), 9);
  await audit();
  for (const q of ["陶芸", "ハーブ", "刺繍", "星座"]) {
    await page.goto(base + "/demo/search");
    await page.getByRole("textbox", { name: "Life Logを全文検索" }).fill(q);
    await page.getByRole("button", { name: "検索", exact: true }).click();
    await page.waitForURL("**/demo/search?q=*");
    assert.ok((await page.locator(".search-result").count()) >= 3, q);
    assert.ok((await page.locator("mark").count()) > 0);
    await audit();
    await page.locator(".search-result").first().click();
    await page.waitForURL("**/demo/log/*");
    await audit();
  }
  await page.goto(base + "/demo/search?q=存在しないキーワード");
  assert.equal(await page.locator(".search-result").count(), 0);
  await audit();
  for (const route of [
    "/demo/log/2026-02-30",
    "/demo/log/2020-01-01",
    "/demo/unknown",
    "/demo/api/auth/session",
  ]) {
    await page.goto(base + route);
    assert.match(
      await page.locator("h1").innerText(),
      /デモの記録が見つかりません/,
    );
    await audit();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/demo",
    "/demo/calendar",
    "/demo/ideas",
    "/demo/search?q=刺繍",
    "/demo/next-actions",
    "/demo/settings",
    "/demo/log/2026-09-30",
  ]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await audit();
    if (route === "/demo")
      await page.screenshot({
        path: "/tmp/lifelog-public-demo-mobile.png",
        fullPage: true,
      });
  }
  assert.deepEqual(badRequests, []);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: anonymous LT flow, 9 dates, 27 ideas, 4 search terms, scoped links/forms, invalid routes, 7 mobile pages; zero private/API/external browser requests.",
  );
} finally {
  await browser.close();
}
