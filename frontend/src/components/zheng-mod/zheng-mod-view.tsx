import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/common/surface";
import { CheckCircle2, RotateCcw, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import {
  readZhengModFeatures,
  resetZhengModFeatures,
  setZhengModFeature,
  subscribeZhengModFeatures,
  UPSTREAM_APP_VERSION,
  ZHENG_MOD_VERSION,
  type ZhengModFeatureKey,
  type ZhengModFeatures,
} from "@/lib/zheng-mod-config";

const ITEMS: Array<{
  key: ZhengModFeatureKey;
  title: string;
  description: string;
}> = [
  {
    key: "downloadMemory",
    title: "持久下载记忆",
    description: "记住已经下载或正在排队的作品，软件重启后仍然保留状态。",
  },
  {
    key: "skipDuplicateDownloads",
    title: "自动跳过重复下载",
    description: "单个和批量下载前检查作品 ID，已下载或已排队的作品自动跳过。",
  },
  {
    key: "showDownloadBadges",
    title: "卡片显示已下载状态",
    description: "在点赞、收藏、推荐、搜索等视频卡片上显示“已下载 / 已排队”。",
  },
  {
    key: "syncExistingHistory",
    title: "启动时同步现有下载记录",
    description: "启动后读取现有下载历史并回填下载记忆，避免旧文件无法识别。",
  },
];

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-7 w-12 shrink-0 rounded-full border transition-all duration-200",
        checked
          ? "border-accent/40 bg-accent shadow-[0_0_0_3px_rgba(254,44,85,0.08)]"
          : "border-border bg-white/[0.05]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200",
          checked ? "left-6" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}

export function ZhengModView() {
  const [features, setFeatures] = useState<ZhengModFeatures>(() => readZhengModFeatures());

  useEffect(() => subscribeZhengModFeatures(() => setFeatures(readZhengModFeatures())), []);

  const setFeature = (key: ZhengModFeatureKey, enabled: boolean) => {
    setZhengModFeature(key, enabled);
    setFeatures(readZhengModFeatures());
  };

  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Surface density="default" tone="solid" className="rounded-[18px] border-accent/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-[1.05rem] font-bold text-text">郑老师魔改版</h2>
              <Badge variant="default">Zheng Mod</Badge>
            </div>
            <p className="max-w-2xl text-[0.78rem] leading-relaxed text-text-muted">
              这里集中管理郑老师魔改功能。所有功能首次安装默认开启，开关会保存在本机。
            </p>
          </div>
          <div className="rounded-[14px] border border-border bg-white/[0.02] px-4 py-3 text-right">
            <div className="text-[0.66rem] font-semibold uppercase tracking-wider text-text-muted">魔改版本</div>
            <div className="mt-1 font-mono text-[1rem] font-bold text-accent">v{ZHENG_MOD_VERSION}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[12px] border border-border bg-white/[0.02] p-3">
            <div className="text-[0.66rem] text-text-muted">原版基础版本</div>
            <div className="mt-1 font-mono text-[0.82rem] font-semibold text-text">v{UPSTREAM_APP_VERSION}</div>
          </div>
          <div className="rounded-[12px] border border-border bg-white/[0.02] p-3">
            <div className="text-[0.66rem] text-text-muted">魔改版本</div>
            <div className="mt-1 font-mono text-[0.82rem] font-semibold text-text">v{ZHENG_MOD_VERSION}</div>
          </div>
          <div className="rounded-[12px] border border-border bg-white/[0.02] p-3">
            <div className="text-[0.66rem] text-text-muted">已开启功能</div>
            <div className="mt-1 flex items-center gap-1.5 text-[0.82rem] font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" />
              {enabledCount} / {ITEMS.length}
            </div>
          </div>
        </div>
      </Surface>

      <Surface density="default" tone="muted" className="rounded-[18px]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-text-muted" />
            <h3 className="text-[0.86rem] font-semibold text-text">功能开关</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetZhengModFeatures();
              setFeatures(readZhengModFeatures());
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            恢复默认全开
          </Button>
        </div>

        <div className="space-y-2">
          {ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[0.8rem] font-semibold text-text">{item.title}</span>
                  {features[item.key] && (
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-[0.62rem] font-semibold text-success">
                      已开启
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[0.7rem] leading-relaxed text-text-muted">{item.description}</div>
              </div>
              <Switch
                checked={features[item.key]}
                label={item.title}
                onChange={(checked) => setFeature(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </Surface>

      <Surface density="compact" tone="muted" className="rounded-[14px]">
        <div className="flex items-center gap-2 text-[0.72rem] text-text-muted">
          <ShieldCheck className="h-4 w-4 text-success" />
          这些开关只控制郑老师魔改层，不改变原版账号、下载目录、清晰度等设置。
        </div>
      </Surface>
    </div>
  );
}
