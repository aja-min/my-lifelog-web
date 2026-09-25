import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/lifelog-desktop.png", fullPage: true });
console.log("Desktop title:", await page.title());
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
console.log("Desktop: no overflow");
await page.getByRole("link", { name: "この日のLife Logを読む" }).click();
await page.waitForURL("**/log/2026-09-24");
await page.getByText("Raw Markdownを見る").click();
assert.equal(await page.locator(".raw-markdown pre").isVisible(), true);
await page.goto("http://127.0.0.1:3000/calendar?month=2026-09");
assert.equal(await page.locator(".month-cell a").count(), 5);
await page.getByRole("link", { name: "前月", exact: true }).click();
await page.waitForURL("**/calendar?month=2026-08");
console.log(
  "Previous month:",
  await page.locator(".calendar-toolbar h2").innerText(),
);
await page.goto("http://127.0.0.1:3000/search");
await page.getByRole("textbox", { name: "Life Logを全文検索" }).fill("小説");
await page.getByRole("button", { name: "検索", exact: true }).click();
await page.waitForURL("**/search?q=*");
assert.equal(await page.locator(".search-result").count(), 6);
assert.ok((await page.locator("mark").count()) > 0);
await page.goto("http://127.0.0.1:3000/ideas?type=writingIdeas");
assert.equal(await page.locator(".idea-card").count(), 6);
await page.goto("http://127.0.0.1:3000/next-actions");
assert.equal(await page.locator(".action-item").count(), 12);
await page.setViewportSize({ width: 390, height: 844 });
for (const route of [
  "/",
  "/calendar",
  "/search?q=散歩",
  "/ideas",
  "/next-actions",
  "/settings",
  "/log/2026-09-24",
]) {
  await page.goto(`http://127.0.0.1:3000${route}`, {
    waitUntil: "networkidle",
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  if (overflow) throw new Error(`Mobile overflow at ${route}`);
  if (route === "/")
    await page.screenshot({ path: "/tmp/lifelog-mobile.png", fullPage: true });
}
console.log("Mobile: all 7 routes fit 390px");
console.log("Browser errors:", errors);
if (errors.length) throw new Error("Browser errors detected");
await browser.close();
