import { readBoolean, writeBoolean } from "@/lib/storage";

export const ZHENG_MOD_VERSION = "1.0.0-z1";
export const UPSTREAM_APP_VERSION = "1.1.5";

export interface ZhengModFeatures {
  downloadMemory: boolean;
  skipDuplicateDownloads: boolean;
  showDownloadBadges: boolean;
  syncExistingHistory: boolean;
}

export type ZhengModFeatureKey = keyof ZhengModFeatures;

const FEATURE_KEYS: Record<ZhengModFeatureKey, string> = {
  downloadMemory: "zheng-mod.downloadMemory",
  skipDuplicateDownloads: "zheng-mod.skipDuplicateDownloads",
  showDownloadBadges: "zheng-mod.showDownloadBadges",
  syncExistingHistory: "zheng-mod.syncExistingHistory",
};

const DEFAULTS: ZhengModFeatures = {
  downloadMemory: true,
  skipDuplicateDownloads: true,
  showDownloadBadges: true,
  syncExistingHistory: true,
};

const EVENT_NAME = "zheng-mod:features-changed";

export function readZhengModFeatures(): ZhengModFeatures {
  return {
    downloadMemory: readBoolean(FEATURE_KEYS.downloadMemory, DEFAULTS.downloadMemory),
    skipDuplicateDownloads: readBoolean(FEATURE_KEYS.skipDuplicateDownloads, DEFAULTS.skipDuplicateDownloads),
    showDownloadBadges: readBoolean(FEATURE_KEYS.showDownloadBadges, DEFAULTS.showDownloadBadges),
    syncExistingHistory: readBoolean(FEATURE_KEYS.syncExistingHistory, DEFAULTS.syncExistingHistory),
  };
}

export function isZhengModFeatureEnabled(key: ZhengModFeatureKey): boolean {
  return readZhengModFeatures()[key];
}

export function setZhengModFeature(key: ZhengModFeatureKey, enabled: boolean) {
  writeBoolean(FEATURE_KEYS[key], enabled);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { key, enabled } }));
  }
}

export function resetZhengModFeatures() {
  (Object.keys(DEFAULTS) as ZhengModFeatureKey[]).forEach((key) => {
    writeBoolean(FEATURE_KEYS[key], DEFAULTS[key]);
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function subscribeZhengModFeatures(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
