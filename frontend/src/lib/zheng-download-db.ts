import { readJson, writeJson } from "@/lib/storage";

export type ZhengDownloadSource =
  | "liked"
  | "collected"
  | "recommended"
  | "search"
  | "author"
  | "mix"
  | "unknown";

export type ZhengDownloadState = "seen" | "queued" | "downloaded" | "failed";

export interface ZhengDownloadRecord {
  awemeId: string;
  title?: string;
  author?: string;
  sources: ZhengDownloadSource[];
  state: ZhengDownloadState;
  firstSeenAt: number;
  lastSeenAt: number;
  queuedAt?: number;
  downloadedAt?: number;
  failedAt?: number;
  error?: string;
}

type Db = Record<string, ZhengDownloadRecord>;

const KEY = "zheng-mod.download-db.v2";
const EVENT = "zheng-mod:download-db-changed";

function readDb(): Db {
  return readJson<Db>(KEY, {});
}

function writeDb(db: Db) {
  writeJson(KEY, db);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT));
}

function normalizeSource(source?: string): ZhengDownloadSource {
  return ["liked","collected","recommended","search","author","mix"].includes(String(source))
    ? (source as ZhengDownloadSource)
    : "unknown";
}

export function upsertDownloadRecord(
  awemeId: string,
  patch: Partial<Omit<ZhengDownloadRecord, "awemeId" | "sources" | "firstSeenAt" | "lastSeenAt">> & {
    source?: string;
    title?: string;
    author?: string;
  }
) {
  const id = String(awemeId || "").trim();
  if (!id) return;
  const db = readDb();
  const now = Date.now();
  const previous = db[id];
  const source = normalizeSource(patch.source);
  const sources = Array.from(new Set([...(previous?.sources || []), source]));
  db[id] = {
    awemeId: id,
    sources,
    state: patch.state || previous?.state || "seen",
    firstSeenAt: previous?.firstSeenAt || now,
    lastSeenAt: now,
    title: patch.title ?? previous?.title,
    author: patch.author ?? previous?.author,
    queuedAt: patch.queuedAt ?? previous?.queuedAt,
    downloadedAt: patch.downloadedAt ?? previous?.downloadedAt,
    failedAt: patch.failedAt ?? previous?.failedAt,
    error: patch.error ?? previous?.error,
  };
  writeDb(db);
}

export function markVideoSeen(awemeId: string, source?: string, title?: string, author?: string) {
  const current = getZhengDownloadRecord(awemeId);
  const state = current && ["queued", "downloaded", "failed"].includes(current.state)
    ? current.state
    : "seen";
  upsertDownloadRecord(awemeId, { state, source, title, author });
}

export function markDownloadQueued(awemeId: string, source?: string, title?: string, author?: string) {
  upsertDownloadRecord(awemeId, { state: "queued", source, title, author, queuedAt: Date.now(), error: undefined });
}

export function markDownloadCompleted(awemeId: string) {
  upsertDownloadRecord(awemeId, { state: "downloaded", downloadedAt: Date.now(), error: undefined });
}

export function markDownloadFailed(awemeId: string, error: string, source?: string, title?: string, author?: string) {
  upsertDownloadRecord(awemeId, { state: "failed", failedAt: Date.now(), error, source, title, author });
}

export function clearDownloadFailure(awemeId: string) {
  const db = readDb();
  const item = db[awemeId];
  if (!item) return;
  db[awemeId] = { ...item, state: "seen", error: undefined, failedAt: undefined, lastSeenAt: Date.now() };
  writeDb(db);
}

export function getZhengDownloadRecord(awemeId?: string | null) {
  const id = String(awemeId || "").trim();
  if (!id) return null;
  return readDb()[id] || null;
}

export function getZhengDownloadRecords() {
  return Object.values(readDb()).sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

export function getFailedDownloadRecords() {
  return getZhengDownloadRecords()
    .filter((item) => item.state === "failed")
    .sort((a, b) => (b.failedAt || 0) - (a.failedAt || 0));
}

export function getZhengDownloadStats() {
  const items = Object.values(readDb());
  return {
    total: items.length,
    seen: items.filter((x) => x.state === "seen").length,
    queued: items.filter((x) => x.state === "queued").length,
    downloaded: items.filter((x) => x.state === "downloaded").length,
    failed: items.filter((x) => x.state === "failed").length,
  };
}

export function exportZhengDownloadDb() {
  return JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    records: getZhengDownloadRecords(),
  }, null, 2);
}

export function subscribeZhengDownloadDb(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
