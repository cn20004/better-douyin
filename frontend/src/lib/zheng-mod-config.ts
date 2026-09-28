import { readBoolean, writeBoolean } from "@/lib/storage";

export const ZHENG_MOD_VERSION = "1.1.0-z2";
export const UPSTREAM_APP_VERSION = "1.1.5";

export interface ZhengModFeatures {
  downloadMemory: boolean;
  skipDuplicateDownloads: boolean;
  showDownloadBadges: boolean;
  syncExistingHistory: boolean;
  rememberScrollPosition: boolean;
  trackViewedVideos: boolean;
  trackDownloadSource: boolean;
  failedDownloadList: boolean;
  showDownloadFilters: boolean;
}

export type ZhengModFeatureKey = keyof ZhengModFeatures;

const FEATURE_KEYS: Record<ZhengModFeatureKey, string> = {
  downloadMemory: "zheng-mod.downloadMemory",
  skipDuplicateDownloads: "zheng-mod.skipDuplicateDownloads",
  showDownloadBadges: "zheng-mod.showDownloadBadges",
  syncExistingHistory: "zheng-mod.syncExistingHistory",
  rememberScrollPosition: "zheng-mod.rememberScrollPosition",
  trackViewedVideos: "zheng-mod.trackViewedVideos",
  trackDownloadSource: "zheng-mod.trackDownloadSource",
  failedDownloadList: "zheng-mod.failedDownloadList",
  showDownloadFilters: "zheng-mod.showDownloadFilters",
};

const DEFAULTS: ZhengModFeatures = {
  downloadMemory: true,
  skipDuplicateDownloads: true,
  showDownloadBadges: true,
  syncExistingHistory: true,
  rememberScrollPosition: true,
  trackViewedVideos: true,
  trackDownloadSource: true,
  failedDownloadList: true,
  showDownloadFilters: true,
};

const EVENT_NAME = "zheng-mod:features-changed";

export function readZhengModFeatures(): ZhengModFeatures {
  return {
    downloadMemory: readBoolean(FEATURE_KEYS.downloadMemory, DEFAULTS.downloadMemory),
    skipDuplicateDownloads: readBoolean(FEATURE_KEYS.skipDuplicateDownloads, DEFAULTS.skipDuplicateDownloads),
    showDownloadBadges: readBoolean(FEATURE_KEYS.showDownloadBadges, DEFAULTS.showDownloadBadges),
    syncExistingHistory: readBoolean(FEATURE_KEYS.syncExistingHistory, DEFAULTS.syncExistingHistory),
    rememberScrollPosition: readBoolean(FEATURE_KEYS.rememberScrollPosition, DEFAULTS.rememberScrollPosition),
    trackViewedVideos: readBoolean(FEATURE_KEYS.trackViewedVideos, DEFAULTS.trackViewedVideos),
    trackDownloadSource: readBoolean(FEATURE_KEYS.trackDownloadSource, DEFAULTS.trackDownloadSource),
    failedDownloadList: readBoolean(FEATURE_KEYS.failedDownloadList, DEFAULTS.failedDownloadList),
    showDownloadFilters: readBoolean(FEATURE_KEYS.showDownloadFilters, DEFAULTS.showDownloadFilters),
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
