import { readJson, writeJson } from "@/lib/storage";
import { isZhengModFeatureEnabled } from "@/lib/zheng-mod-config";

export type DownloadMemoryStatus = "queued" | "downloaded";

export interface DownloadMemoryEntry {
  awemeId: string;
  status: DownloadMemoryStatus;
  updatedAt: number;
  title?: string;
  author?: string;
}

const STORAGE_KEY = "better-douyin:download-memory:v1";
const EVENT_NAME = "better-douyin:download-memory-changed";
const QUEUED_TTL_MS = 24 * 60 * 60 * 1000;

type DownloadMemoryMap = Record<string, DownloadMemoryEntry>;

function readMap(): DownloadMemoryMap {
  const raw = readJson<DownloadMemoryMap>(STORAGE_KEY, {});
  const now = Date.now();
  let changed = false;
  for (const [id, entry] of Object.entries(raw)) {
    if (!entry || !entry.awemeId) {
      delete raw[id];
      changed = true;
      continue;
    }
    if (entry.status === "queued" && now - Number(entry.updatedAt || 0) > QUEUED_TTL_MS) {
      delete raw[id];
      changed = true;
    }
  }
  if (changed) writeJson(STORAGE_KEY, raw);
  return raw;
}

function writeMap(value: DownloadMemoryMap) {
  writeJson(STORAGE_KEY, value);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function getDownloadMemoryStatus(awemeId?: string | null): DownloadMemoryStatus | null {
  if (!isZhengModFeatureEnabled("downloadMemory")) return null;
  const id = String(awemeId || "").trim();
  if (!id) return null;
  return readMap()[id]?.status || null;
}

export function isDownloadKnown(awemeId?: string | null): boolean {
  return getDownloadMemoryStatus(awemeId) !== null;
}

export function rememberDownload(
  awemeId: string,
  status: DownloadMemoryStatus,
  meta: { title?: string; author?: string } = {}
) {
  if (!isZhengModFeatureEnabled("downloadMemory")) return;
  const id = String(awemeId || "").trim();
  if (!id) return;
  const map = readMap();
  map[id] = {
    awemeId: id,
    status,
    updatedAt: Date.now(),
    title: meta.title,
    author: meta.author,
  };
  writeMap(map);
}

export function forgetQueuedDownload(awemeId?: string | null) {
  const id = String(awemeId || "").trim();
  if (!id) return;
  const map = readMap();
  if (map[id]?.status !== "queued") return;
  delete map[id];
  writeMap(map);
}

export function rememberDownloadedIds(ids: Array<string | null | undefined>) {
  if (!isZhengModFeatureEnabled("downloadMemory")) return;
  const map = readMap();
  let changed = false;
  const now = Date.now();
  for (const value of ids) {
    const id = String(value || "").trim();
    if (!id) continue;
    const previous = map[id];
    if (previous?.status === "downloaded") continue;
    map[id] = { ...(previous || { awemeId: id }), awemeId: id, status: "downloaded", updatedAt: now };
    changed = true;
  }
  if (changed) writeMap(map);
}

export function getDownloadMemoryCount() {
  return Object.keys(readMap()).length;
}

export function subscribeDownloadMemory(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
