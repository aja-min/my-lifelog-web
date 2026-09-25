import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3001";
for (const route of [
  "/",
  "/calendar",
  "/search?q=private",
  "/ideas",
  "/next-actions",
  "/settings",
  "/log/2026-09-24",
]) {
  for (const rsc of [false, true]) {
    const url =
      base + route + (rsc ? (route.includes("?") ? "&" : "?") + "_rsc" : "");
    const response = await fetch(url, {
      redirect: "manual",
      headers: rsc ? { RSC: "1" } : {},
    });
    const body = await response.text();
    assert.ok(
      response.status === 307 || body.includes("NEXT_REDIRECT"),
      `${route}: missing redirect`,
    );
    assert.ok(
      response.headers.get("location") === "/login" || body.includes("/login"),
      `${route}: missing login target`,
    );
    assert.ok(
      !body.includes("いつもの一日に、新しい種をまく"),
      `${route}: leaked sample log in production`,
    );
    assert.match(
      response.headers.get("cache-control") ?? "",
      /no-store|private/,
    );
  }
}
const response = await fetch(base + "/api/auth/session");
assert.equal(response.status, 503, "Missing credentials must fail closed");
const login = await fetch(base + "/login");
assert.equal(login.status, 200);
assert.match(await login.text(), /設定が完了するまで/);
console.log(
  "PASS: 7 routes + 7 RSC requests protected, private cache headers, auth fails closed, login setup renders.",
);
