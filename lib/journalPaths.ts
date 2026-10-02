// Public demo navigation is allow-listed; never forward a private/API URL.
export function journalHref(href: string, basePath: "" | "/demo"): string {
  if (!basePath) return href;
  if (href.startsWith("#")) return href;
  const match = /^(\/[^?#]*)([?#].*)?$/.exec(href);
  if (!match) return "/demo";
  const path = match[1].replace(/^\/demo(?=\/|$)/, "") || "/";
  if (
    !/^\/(?:calendar|search|ideas|next-actions|settings)?$/.test(path) &&
    !/^\/log\/\d{4}-\d{2}-\d{2}$/.test(path)
  )
    return "/demo";
  return "/demo" + (path === "/" ? "" : path) + (match[2] ?? "");
}
