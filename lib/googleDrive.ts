import "server-only";
import { JWT } from "google-auth-library";
import { unstable_cache } from "next/cache";
import { dateFromFilename } from "./parseLifeLog";
export type DriveFile = {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  mimeType?: string;
};
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export function driveConfigured() {
  return Boolean(
    process.env.GOOGLE_DRIVE_FOLDER_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
}
let driveClient: JWT | undefined;
function client() {
  if (!driveConfigured()) throw new Error("DRIVE_NOT_CONFIGURED");
  return (driveClient ??= new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: [SCOPE],
  }));
}
async function driveFetch(path: string, params: Record<string, string>) {
  const access = await client().getAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files${path}?${new URLSearchParams(params)}`,
    {
      headers: { Authorization: `Bearer ${access.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) throw new Error(`DRIVE_REQUEST_FAILED_${response.status}`);
  return response;
}
export async function listDailyFiles(): Promise<DriveFile[]> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
  if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) throw new Error("INVALID_FOLDER_ID");
  return unstable_cache(
    async () => {
      const folder = await (
        await driveFetch(`/${folderId}`, {
          fields: "name,mimeType",
          supportsAllDrives: "true",
        })
      ).json();
      if (
        folder.name !== "Lifelog AI - 1日の要約" ||
        folder.mimeType !== "application/vnd.google-apps.folder"
      )
        throw new Error("WRONG_DAILY_FOLDER");
      const files: DriveFile[] = [];
      let pageToken = "";
      do {
        const page = await (
          await driveFetch("", {
            q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
            fields: "nextPageToken,files(id,name,modifiedTime,size,mimeType)",
            pageSize: "1000",
            supportsAllDrives: "true",
            includeItemsFromAllDrives: "true",
            ...(pageToken ? { pageToken } : {}),
          })
        ).json();
        files.push(
          ...(page.files as DriveFile[]).filter(
            (f) =>
              dateFromFilename(f.name) &&
              !f.mimeType?.startsWith("application/vnd.google-apps."),
          ),
        );
        pageToken = page.nextPageToken ?? "";
      } while (pageToken);
      // One entry per day; newest modified duplicate wins, deterministically.
      const dates = new Map<string, DriveFile>();
      for (const file of files.sort(
        (a, b) =>
          b.modifiedTime.localeCompare(a.modifiedTime) ||
          a.id.localeCompare(b.id),
      )) {
        if (!dates.has(file.name)) dates.set(file.name, file);
      }
      return [...dates.values()].sort((a, b) => b.name.localeCompare(a.name));
    },
    ["daily-file-list-v1", folderId, process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!],
    { revalidate: 300 },
  )();
}
// Only accept file records returned from the folder-scoped listing, never route input.
export async function readDailyFile(file: DriveFile): Promise<string> {
  if (Number(file.size ?? 0) > 2_000_000)
    throw new Error("DAILY_FILE_TOO_LARGE");
  return unstable_cache(
    async () => {
      const response = await driveFetch(`/${encodeURIComponent(file.id)}`, {
        alt: "media",
        supportsAllDrives: "true",
      });
      const text = await response.text();
      if (Buffer.byteLength(text, "utf8") > 2_000_000)
        throw new Error("DAILY_FILE_TOO_LARGE");
      return text;
    },
    [
      "daily-markdown-v1",
      process.env.GOOGLE_DRIVE_FOLDER_ID!,
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      file.id,
      file.modifiedTime,
    ],
    { revalidate: 86400 },
  )();
}
