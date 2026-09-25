import "server-only";
import { cache } from "react";
import { requireUser, demoEnabled } from "./auth";
import { driveConfigured, listDailyFiles, readDailyFile } from "./googleDrive";
import { parseLifeLog } from "./parseLifeLog";
import { demoLogs } from "./demo";
import type { LifeLog } from "./types";
export type LogCollection = {
  logs: LifeLog[];
  state: "ready" | "unconfigured" | "error";
  demo: boolean;
};
export const getLifeLogs = cache(async (): Promise<LogCollection> => {
  await requireUser();
  if (demoEnabled()) return { logs: demoLogs(), state: "ready", demo: true };
  if (!driveConfigured())
    return { logs: [], state: "unconfigured", demo: false };
  try {
    const files = await listDailyFiles();
    const logs: LifeLog[] = [];
    // Bound concurrency to avoid bursting the Drive API on a cold cache.
    for (let i = 0; i < files.length; i += 5) {
      logs.push(
        ...(await Promise.all(
          files
            .slice(i, i + 5)
            .map(async (file) =>
              parseLifeLog(file.id, file.name, await readDailyFile(file)),
            ),
        )),
      );
    }
    return { logs, state: "ready", demo: false };
  } catch {
    // Never expose provider errors, file bodies, IDs or credentials to logs/UI.
    console.error(
      "Life Log: Drive synchronization failed. Check server configuration and folder access.",
    );
    return { logs: [], state: "error", demo: false };
  }
});
