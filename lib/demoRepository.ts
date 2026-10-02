import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { dateFromFilename, parseLifeLog } from "./parseLifeLog";
import type { LogCollection } from "./types";
// Fixed directory, never a request parameter. No auth, Drive, env or network imports.
export const getDemoLifeLogs = cache(async (): Promise<LogCollection> => {
  const directory = path.join(process.cwd(), "data", "demo");
  const names = (await readdir(directory))
    .filter((name) => dateFromFilename(name))
    .sort()
    .reverse();
  const logs = await Promise.all(
    names.map(async (name) =>
      parseLifeLog(
        `public-demo-${name}`,
        name,
        await readFile(path.join(directory, name), "utf8"),
      ),
    ),
  );
  return { logs, state: "ready", demo: true };
});
