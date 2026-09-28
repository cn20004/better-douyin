import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/common/surface";
import { useDownloads } from "@/hooks/use-downloads";
import {
  clearDownloadFailure,
  getFailedDownloadRecords,
  subscribeZhengDownloadDb,
  type ZhengDownloadRecord,
} from "@/lib/zheng-download-db";

export function FailedDownloadsView() {
  const { retryFailedAweme } = useDownloads();
  const [records, setRecords] = useState<ZhengDownloadRecord[]>(() => getFailedDownloadRecords());
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const [retryingAll, setRetryingAll] = useState(false);

  useEffect(() => subscribeZhengDownloadDb(() => setRecords(getFailedDownloadRecords())), []);

  const sourceLabel = (source?: string) =>
    ({
      liked: "点赞",
      collected: "收藏",
      recommended: "推荐",
      search: "搜索",
      author: "作者主页",
      mix: "收藏合集",
      unknown: "未知",
    } as Record<string, string>)[source || "unknown"] || source || "未知";

  const retryOne = async (record: ZhengDownloadRecord) => {
    if (retrying.has(record.awemeId)) return;
    setRetrying((current) => new Set(current).add(record.awemeId));
    try {
      await retryFailedAweme(record);
    } finally {
      setRetrying((current) => {
        const next = new Set(current);
        next.delete(record.awemeId);
        return next;
      });
      setRecords(getFailedDownloadRecords());
    }
  };

  const retryAll = async () => {
    if (retryingAll || records.length === 0) return;
    setRetryingAll(true);
    try {
      for (const record of records) {
        await retryFailedAweme(record);
      }
    } finally {
      setRetryingAll(false);
      setRecords(getFailedDownloadRecords());
    }
  };

  const failedCount = records.length;
  const latestFailedAt = useMemo(
    () => Math.max(0, ...records.map((item) => item.failedAt || 0)),
    [records]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-danger" />
          <h2 className="text-[1rem] font-bold text-text">下载失败清单</h2>
          <Badge variant={failedCount > 0 ? "default" : "secondary"}>{failedCount} 条</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setRecords(getFailedDownloadRecords())}>
            <RefreshCw className="h-3.5 w-3.5" />
            刷新
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={records.length === 0 || retryingAll}
            onClick={() => void retryAll()}
          >
            <RotateCcw className={retryingAll ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            {retryingAll ? "正在全部重试" : "全部重新下载"}
          </Button>
        </div>
      </div>

      <Surface density="compact" tone="muted" className="rounded-[14px]">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[0.72rem] text-text-muted">
          <span>失败任务：<b className="text-text">{failedCount}</b></span>
          <span>
            最近失败：
            <b className="ml-1 text-text">
              {latestFailedAt ? new Date(latestFailedAt).toLocaleString() : "暂无"}
            </b>
          </span>
          <span>重试成功后会自动从这个清单移除。</span>
        </div>
      </Surface>

      {records.length === 0 ? (
        <Surface density="default" tone="muted" className="rounded-[18px] py-14 text-center">
          <div className="text-[0.9rem] font-semibold text-text">目前没有失败下载</div>
          <div className="mt-2 text-[0.74rem] text-text-muted">以后单条、批量或重新下载失败的作品都会集中到这里。</div>
        </Surface>
      ) : (
        <div className="space-y-2">
          {records.map((record) => {
            const busy = retrying.has(record.awemeId);
            return (
              <Surface key={record.awemeId} density="default" tone="muted" className="rounded-[16px]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[0.82rem] font-semibold text-text">
                        {record.title || record.awemeId}
                      </span>
                      {record.sources.map((source) => (
                        <Badge key={source} variant="outline">{sourceLabel(source)}</Badge>
                      ))}
                    </div>
                    <div className="mt-1 text-[0.68rem] text-text-muted">
                      {record.author ? `作者：${record.author} · ` : ""}
                      作品ID：{record.awemeId}
                    </div>
                    <div className="mt-2 rounded-[10px] border border-danger/15 bg-danger-soft/40 px-3 py-2 text-[0.72rem] text-danger">
                      {record.error || "下载失败"}
                    </div>
                    <div className="mt-1 text-[0.64rem] text-text-muted">
                      失败时间：{record.failedAt ? new Date(record.failedAt).toLocaleString() : "未知"}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => {
                      clearDownloadFailure(record.awemeId);
                      setRecords(getFailedDownloadRecords());
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                      移出清单
                    </Button>
                    <Button variant="default" size="sm" disabled={busy} onClick={() => void retryOne(record)}>
                      <RotateCcw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                      {busy ? "重新提交中" : "重新下载"}
                    </Button>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}
