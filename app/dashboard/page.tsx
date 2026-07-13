"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Topbar from "@/components/topbar";
import Image from "next/image";
import { userAPI, benchmarkAPI, careerSaveAPI, referenceAPI } from "@/lib/api";

interface DistributionBucket {
  bucket: number;
  rangeStart: number;
  rangeEnd: number;
  count: number;
  cohortSize: number | null;
  certHoldersCount: number | null;
  certRatio: number | null;
  mostCommonDuration: string | null;
}

interface BenchmarkData {
  n: number;
  p10: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  p90: number | null;
  userPercentile: number | null;
  distribution: DistributionBucket[];
}

interface UserProfile {
  nickname: string;
  jobCategoryId: number;
  jobCategoryName: string;
  experienceLevelId: number;
  experienceLevelLabel: string;
}

interface SubmissionItem {
  workFormat: string;
  amount: number;
  amountUnit: string;
  normalizedMonthly: number | null;
  jobCategoryName: string;
  experienceLevelLabel: string;
  submissionType: string;
  createdAt?: string;
}

interface JobCategoryOption {
  id: number;
  name: string;
  children?: JobCategoryOption[] | null;
}

interface ExperienceLevelOption {
  id: number;
  label: string;
}

interface BarData {
  range: string;
  value: number;
  isUser?: boolean;
  bucket?: DistributionBucket;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <p className="text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {caption && <p className="text-xs text-gray-500">{caption}</p>}
    </div>
  );
}

function getBenchmarkAmount(submission: SubmissionItem | null): number | null {
  if (!submission) return null;
  return submission.normalizedMonthly ?? submission.amount;
}

function flattenJobCategories(categories: JobCategoryOption[]): JobCategoryOption[] {
  return categories.flatMap((category) => {
    const children = category.children?.length ? flattenJobCategories(category.children) : [];
    return children.length ? children : [category];
  });
}

function workFormatLabel(format?: string | null) {
  if (format === "ON_SITE") return "100% 상주";
  if (format === "REMOTE") return "100% 원격";
  if (format === "HYBRID") return "상주+원격 혼합";
  return "전체";
}

function getReliability(n?: number | null) {
  if (!n) {
    return {
      label: "데이터 없음",
      tone: "text-gray-500",
      description: "아직 비교 가능한 시장 데이터가 충분하지 않습니다.",
    };
  }
  if (n >= 50) {
    return {
      label: "신뢰도 높음",
      tone: "text-main100",
      description: `유사 조건 ${n}건을 기준으로 안정적인 비교가 가능합니다.`,
    };
  }
  if (n >= 15) {
    return {
      label: "신뢰도 보통",
      tone: "text-[#0f766e]",
      description: `유사 조건 ${n}건을 기준으로 시장 범위를 참고할 수 있습니다.`,
    };
  }
  return {
    label: "참고용",
    tone: "text-[#b45309]",
    description: `유사 조건 ${n}건만 있어 방향성 확인용으로 보는 것이 좋습니다.`,
  };
}

function getPositionLabel(percentile: number | null | undefined) {
  if (percentile == null) return "위치 계산 전";
  if (percentile >= 90) return "프리미엄 상단";
  if (percentile >= 75) return "프리미엄 구간";
  if (percentile >= 50) return "시장 평균 상단";
  if (percentile >= 25) return "시장 평균 하단";
  return "저가 진입 구간";
}

function getMarketInsight(benchmark: BenchmarkData | null, userAmount: number | null) {
  if (!benchmark || benchmark.userPercentile == null || userAmount == null || !benchmark.median) {
    return "최근 등록한 단가와 유사 조건의 시장 데이터를 함께 확인해보세요.";
  }

  const diffPct = Math.round(((userAmount - benchmark.median) / benchmark.median) * 100);
  const direction = diffPct >= 0 ? "높습니다" : "낮습니다";
  const absDiff = Math.abs(diffPct);
  const positionLabel = getPositionLabel(benchmark.userPercentile);

  if (absDiff <= 5) {
    return `현재 단가는 시장 중앙값과 거의 비슷한 ${positionLabel}입니다. 견적에서는 범위와 산출물 조건을 명확히 제시하는 편이 좋습니다.`;
  }

  return `현재 단가는 시장 중앙값보다 약 ${absDiff}% ${direction}. ${positionLabel}에 맞춰 단가 근거와 포함 범위를 함께 설명하는 것이 좋습니다.`;
}

function PercentileBand({
  benchmark,
  userAmount,
}: {
  benchmark: BenchmarkData | null;
  userAmount: number | null;
}) {
  if (!benchmark?.p10 || !benchmark.p25 || !benchmark.median || !benchmark.p75 || !benchmark.p90) {
    return null;
  }

  const range = Math.max(1, benchmark.p90 - benchmark.p10);
  const markerPct =
    userAmount != null
      ? Math.min(100, Math.max(0, ((userAmount - benchmark.p10) / range) * 100))
      : null;

  const segments = [
    { label: "하위권", from: benchmark.p10, to: benchmark.p25, className: "bg-[#dbeafe]" },
    { label: "평균 하단", from: benchmark.p25, to: benchmark.median, className: "bg-[#c7d2fe]" },
    { label: "평균 상단", from: benchmark.median, to: benchmark.p75, className: "bg-[#ddd6fe]" },
    { label: "프리미엄", from: benchmark.p75, to: benchmark.p90, className: "bg-[#fde2e2]" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">시장 포지션 밴드</h2>
          <p className="mt-1 text-sm text-gray-500">월 환산 단가 기준 분위수 범위입니다.</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-main100">{getPositionLabel(benchmark.userPercentile)}</p>
          <p className="text-xs text-gray-500">
            {benchmark.userPercentile != null ? `${benchmark.userPercentile}% 지점` : "위치 계산 전"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-12 overflow-visible rounded-lg border border-gray-200">
          <div className="grid h-full grid-cols-4 overflow-hidden rounded-lg">
            {segments.map((segment) => (
              <div key={segment.label} className={`${segment.className} px-2 py-2`}>
                <p className="truncate text-xs font-semibold text-gray-700">{segment.label}</p>
                <p className="truncate text-[11px] text-gray-600">
                  {segment.from}-{segment.to}만
                </p>
              </div>
            ))}
          </div>
          {markerPct != null && (
            <div
              className="absolute top-[-7px] flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${markerPct}%` }}
            >
              <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                내 단가
              </span>
              <span className="mt-1 h-10 w-0.5 bg-gray-900" />
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs text-gray-500">
          <span>P10 {benchmark.p10}만</span>
          <span>P25 {benchmark.p25}만</span>
          <span>중앙 {benchmark.median}만</span>
          <span>P75 {benchmark.p75}만</span>
          <span>P90 {benchmark.p90}만</span>
        </div>
      </div>
    </div>
  );
}

function BenchmarkExplorer({
  jobOptions,
  levelOptions,
  selectedJobCategoryId,
  selectedExperienceLevelId,
  selectedWorkFormat,
  customAmount,
  isLoading,
  onJobChange,
  onLevelChange,
  onWorkFormatChange,
  onAmountChange,
}: {
  jobOptions: JobCategoryOption[];
  levelOptions: ExperienceLevelOption[];
  selectedJobCategoryId: number | null;
  selectedExperienceLevelId: number | null;
  selectedWorkFormat: string;
  customAmount: string;
  isLoading: boolean;
  onJobChange: (value: number) => void;
  onLevelChange: (value: number | null) => void;
  onWorkFormatChange: (value: string) => void;
  onAmountChange: (value: string) => void;
}) {
  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">조건 조정 시뮬레이터</h2>
          <p className="mt-1 text-sm text-gray-500">직무, 경력, 근무 형태, 내 단가를 바꿔 시장 위치를 다시 계산합니다.</p>
        </div>
        {isLoading && <span className="text-xs font-semibold text-main100">다시 계산 중...</span>}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          직무
          <select
            value={selectedJobCategoryId ?? ""}
            onChange={(e) => onJobChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-main100"
          >
            {jobOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          경력
          <select
            value={selectedExperienceLevelId ?? ""}
            onChange={(e) => onLevelChange(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-main100"
          >
            <option value="">전체 경력</option>
            {levelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          근무 형태
          <select
            value={selectedWorkFormat}
            onChange={(e) => onWorkFormatChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-main100"
          >
            <option value="">전체 형태</option>
            <option value="ON_SITE">100% 상주</option>
            <option value="REMOTE">100% 원격</option>
            <option value="HYBRID">상주+원격 혼합</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          내 위치
          <input
            type="number"
            min="1"
            value={customAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="예: 450"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-main100"
          />
        </label>
      </div>
    </div>
  );
}

function TrendCard({ submissions }: { submissions: SubmissionItem[] }) {
  const values = submissions
    .map((item) => getBenchmarkAmount(item))
    .filter((value): value is number => value != null);

  if (values.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">내 단가 추세</h2>
        <p className="mt-2 text-sm text-gray-500">단가 기록을 추가하면 변화 추세를 확인할 수 있습니다.</p>
      </div>
    );
  }

  const latest = values[0];
  const previous = values[1] ?? null;
  const diffPct = previous ? Math.round(((latest - previous) / previous) * 100) : null;
  const recentAverage = Math.round(values.slice(0, 3).reduce((sum, value) => sum + value, 0) / Math.min(values.length, 3));
  const max = Math.max(...values);
  const min = Math.min(...values);

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">내 단가 추세</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">최근 변화</p>
          <p className={`mt-1 text-lg font-bold ${diffPct != null && diffPct >= 0 ? "text-main100" : "text-[#b45309]"}`}>
            {diffPct != null ? `${diffPct >= 0 ? "+" : ""}${diffPct}%` : "-"}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">최근 3건 평균</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{recentAverage}만</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">최고 기록</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{max}만</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">최저 기록</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{min}만</p>
        </div>
      </div>
    </div>
  );
}

function Tooltip({
  visible,
  bucket,
  heightPct,
  totalN,
}: {
  visible: boolean;
  bucket?: DistributionBucket;
  heightPct: number;
  totalN: number;
}) {
  if (!visible || !bucket) return null;

  const pct =
    totalN > 0
      ? Math.round((bucket.count / totalN) * 100)
      : bucket.certRatio != null
        ? Math.round(bucket.certRatio * 100)
        : null;

  const certPercentage = bucket.certRatio != null ? Math.round(bucket.certRatio * 100) : null;
  const certPer10 = bucket.certRatio != null ? (bucket.certRatio * 10).toFixed(1) : null;

  return (
    <div
      className="absolute z-20 left-1/2 -translate-x-1/2 w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs leading-relaxed pointer-events-none"
      style={{ bottom: `calc(${heightPct}% + 10px)` }}
      role="tooltip"
    >
      {/* Arrow pointing down */}
      <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-b border-r border-gray-200 bg-white" />
      <p className="font-semibold text-gray-800 mb-0.5">
        이 구간({bucket.rangeStart}~{bucket.rangeEnd}만 원)
      </p>
      <p className="text-gray-600">
        : 전체의 {pct}%
      </p>
      {bucket.cohortSize != null && bucket.certHoldersCount != null && (
        <p className="text-main100 font-medium mt-0.5">
          {certPercentage != null && `${certPercentage}%의 디자이너가 자격증을 가지고 있어요.`}
        </p>
      )}
    </div>
  );
}

function BarChart({
  data,
  yTicks,
  maxValue,
  median,
  totalN,
}: {
  data: BarData[];
  yTicks: number[];
  maxValue: number;
  median: number | null;
  totalN: number;
}) {
  const initialUserBar = data.find((b) => b.isUser)?.range ?? null;
  const [hoveredBar, setHoveredBar] = useState<string | null>(initialUserBar);
  const BAR_HEIGHT = 180;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            단가 분포 그래프
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            시장의 중간 가격:{" "}
            <span className="font-semibold text-main100">
              {median != null ? `${median}만 원` : "-"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-gradient-to-t from-[#454EFF] to-[#B0C2FF]" />
            시장 데이터
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-gradient-to-t from-pink-300 to-pink-200" />
            내 단가
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 flex gap-3">
        {/* Y-axis */}
        <div
          className="flex flex-col-reverse justify-between pb-6 pr-2 text-right text-xs"
          style={{ height: BAR_HEIGHT + 24 }}
        >
          {yTicks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* Bars area */}
        <div className="flex flex-1 flex-col">
          <div
            className="relative flex items-end gap-1.5"
            style={{ height: BAR_HEIGHT }}
          >
            {/* Y gridlines */}
            {yTicks.slice(1).map((t) => (
              <div
                key={t}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-200"
                style={{ bottom: `${(t / maxValue) * 100}%` }}
              />
            ))}

            {/* Bars */}
            {data.map((bar) => {
              const heightPct = bar.value > 0 ? (bar.value / maxValue) * 100 : 0;
              const isHovered = hoveredBar === bar.range;
              return (
                <div
                  key={bar.range}
                  className="relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: "100%" }}
                  onMouseEnter={() => setHoveredBar(bar.range)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  <Tooltip
                    visible={isHovered}
                    bucket={bar.bucket}
                    heightPct={heightPct}
                    totalN={totalN}
                  />

                  {/* Dot on top */}
                  {bar.value > 0 && (
                    <div
                      className={`absolute z-10 h-3 w-3 rounded-full bg-white border shadow ${
                        bar.isUser ? "border-pink-400" : "border-main100"
                      }`}
                      style={{ bottom: `calc(${heightPct}% - 6px)` }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Bar */}
                  {bar.value > 0 && (
                    <div
                      className={`w-10 rounded-t-md ${
                        bar.isUser
                          ? "bg-gradient-to-t from-pink-300 to-pink-200"
                          : "bg-gradient-to-t from-[#454EFF] to-[#B0C2FF]"
                      } ${isHovered ? "brightness-110" : ""}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* X labels */}
          <div className="mt-2 flex gap-1.5">
            {data.map((bar) => (
              <div
                key={bar.range}
                className="flex-1 text-center text-[10px] text-gray-400"
              >
                {bar.range}
              </div>
            ))}
          </div>
          <p className="mt-1 text-center text-xs text-gray-400">
            단가 (만원)
          </p>
        </div>

        <div
          className="flex items-center justify-center"
          style={{ height: BAR_HEIGHT }}
        >
          <p
            className="text-xs text-gray-400"
            style={{ writingMode: "vertical-rl" }}
          >
            디자이너 수(명)
          </p>
        </div>
      </div>

      {/* CTA button */}
      <div className="mt-4 flex justify-end">
        <Link href="/onboarding" className="flex items-center gap-2 rounded-full bg-main100 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#6a5ee6]">
          <span className="text-base">+</span> 새로운 프로젝트 업데이트하기
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketDashboard() {
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<SubmissionItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [jobOptions, setJobOptions] = useState<JobCategoryOption[]>([]);
  const [levelOptions, setLevelOptions] = useState<ExperienceLevelOption[]>([]);
  const [selectedJobCategoryId, setSelectedJobCategoryId] = useState<number | null>(null);
  const [selectedExperienceLevelId, setSelectedExperienceLevelId] = useState<number | null>(null);
  const [selectedWorkFormat, setSelectedWorkFormat] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const load = async () => {
      const userId =
        typeof window !== "undefined"
          ? Number(localStorage.getItem("userId"))
          : null;
      if (!userId) {
        setError("로그인이 필요합니다.");
        setIsLoading(false);
        return;
      }

      try {
        const [profile, submissionItems, categoryTree, experienceLevels] = await Promise.all([
          userAPI.getProfile(userId),
          userAPI.getSubmissions(userId),
          referenceAPI.getJobCategories(),
          referenceAPI.getExperienceLevels(),
        ]);

        const latest: SubmissionItem | null = submissionItems?.[0] ?? null;
        const flattenedCategories = flattenJobCategories(categoryTree ?? []);
        setUserProfile(profile);
        setLatestSubmission(latest);
        setSubmissions(submissionItems ?? []);
        setJobOptions(flattenedCategories);
        setLevelOptions(experienceLevels ?? []);
        setSelectedJobCategoryId(profile.jobCategoryId ?? flattenedCategories[0]?.id ?? null);
        setSelectedExperienceLevelId(profile.experienceLevelId ?? null);
        setSelectedWorkFormat(latest?.workFormat ?? "");
        setCustomAmount(getBenchmarkAmount(latest)?.toString() ?? "");

        // 이미 저장된 기록이 있으면 saveStatus를 "saved"로 설정
        const raw = localStorage.getItem("careerSavedIds");
        const savedIds: number[] = raw ? JSON.parse(raw) : [];
        if (savedIds.length > 0) {
          setSaveStatus("saved");
        }

        if (!profile.jobCategoryId) {
          setBenchmark(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "데이터를 불러올 수 없어요."
        );
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (isLoading || !selectedJobCategoryId) return;

    const loadBenchmark = async () => {
      setIsBenchmarkLoading(true);
      try {
        const parsedAmount = Number(customAmount);
        const result = await benchmarkAPI.get({
          jobCategoryId: selectedJobCategoryId,
          experienceLevelId: selectedExperienceLevelId ?? undefined,
          workFormat: selectedWorkFormat || undefined,
          userAmount: parsedAmount > 0 ? parsedAmount : undefined,
        });
        setBenchmark(result);
      } catch {
        setBenchmark(null);
      } finally {
        setIsBenchmarkLoading(false);
      }
    };

    loadBenchmark();
  }, [customAmount, isLoading, selectedExperienceLevelId, selectedJobCategoryId, selectedWorkFormat]);

  const handleSave = () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
    const today = new Date();
    const formattedDate = `${String(today.getFullYear()).slice(-2)}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    setProjectName(`${formattedDate} 프로젝트`);
    setShowProjectModal(true);
  };

  const handleSaveWithProject = async () => {
    const userId = typeof window !== "undefined" ? Number(localStorage.getItem("userId")) : null;
    if (!userId || !userProfile || !latestSubmission) return;

    setSaveStatus("saving");
    try {
      const result = await careerSaveAPI.save({
        jobCategoryId: userProfile.jobCategoryId,
        experienceLevelId: userProfile.experienceLevelId,
        userId,
        submissionType: latestSubmission.submissionType,
        workFormat: latestSubmission.workFormat,
        amount: latestSubmission.amount,
        amountUnit: latestSubmission.amountUnit,
        sessionId: crypto.randomUUID(),
        projectName: projectName || undefined,
      });
      const raw = localStorage.getItem("careerSavedIds");
      const ids: number[] = raw ? JSON.parse(raw) : [];
      if (!ids.includes(result.id)) ids.push(result.id);
      localStorage.setItem("careerSavedIds", JSON.stringify(ids));
      setSaveStatus("saved");
      setShowProjectModal(false);
      setProjectName("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "저장에 실패했습니다.";
      alert(msg);
      setSaveStatus("idle");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-main100 border-t-transparent" />
          <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const selectedJobLabel =
    jobOptions.find((option) => option.id === selectedJobCategoryId)?.name ?? userProfile?.jobCategoryName;
  const selectedLevelLabel =
    levelOptions.find((option) => option.id === selectedExperienceLevelId)?.label ?? "전체 경력";
  const parsedCustomAmount = Number(customAmount);
  const userBenchmarkAmount = parsedCustomAmount > 0 ? parsedCustomAmount : getBenchmarkAmount(latestSubmission);
  const reliability = getReliability(benchmark?.n);
  const marketInsight = getMarketInsight(benchmark, userBenchmarkAmount);

  const tags = [
    selectedJobLabel,
    selectedLevelLabel,
    workFormatLabel(selectedWorkFormat),
    latestSubmission?.amountUnit === "TOTAL" ? "월 환산 비교" : "월 단가 비교",
  ].filter(Boolean) as string[];

  const barData: BarData[] = (benchmark?.distribution ?? []).map((b) => {
    const userInBucket =
      userBenchmarkAmount != null &&
      userBenchmarkAmount >= b.rangeStart &&
      userBenchmarkAmount < b.rangeEnd;
    return {
      range: `${b.rangeStart}-${b.rangeEnd}`,
      value: Number(b.count),
      isUser: userInBucket,
      bucket: b,
    };
  });

  const rawMax = barData.length > 0 ? Math.max(...barData.map((b) => b.value), 1) : 1;
  let yMax: number;
  if (rawMax <= 5) yMax = Math.max(5, Math.ceil(rawMax / 1) * 1);
  else if (rawMax <= 10) yMax = Math.ceil(rawMax / 2) * 2;
  else if (rawMax <= 50) yMax = Math.ceil(rawMax / 5) * 5;
  else yMax = Math.ceil(rawMax / 10) * 10;
  const yTicks = Array.from({ length: 6 }, (_, i) => Math.round((yMax / 5) * i));

  const userBucket = barData.find((b) => b.isUser);
  const userPosition = userBucket
    ? `${userBucket.range}만원`
    : userBenchmarkAmount != null
      ? `${userBenchmarkAmount}만원`
      : "-";

  const getPercentileText = (percentile: number): string => {
    if (percentile >= 75) return "상위 0~25%";
    if (percentile >= 50) return "상위 26~50%";
    if (percentile >= 25) return "하위 26~50%";
    return "하위 0~25%";
  };

  const percentile =
    benchmark?.userPercentile != null
      ? getPercentileText(benchmark.userPercentile)
      : "-";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <Topbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6">
        <h1 className="text-2xl font-extrabold text-gray-900">
          시장 단가 분석 대시보드
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-main25 px-2 py-1 text-xs font-semibold text-main100"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || saveStatus === "saved"}
            className="flex items-center gap-1.5 rounded-lg border border-main100 px-4 py-2 text-sm font-semibold text-main100 transition hover:bg-main25 disabled:border-line1 disabled:text-bodyfont4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Image src="/save.svg" alt="" width={15} height={20} />
            {saveStatus === "saving" && "저장 중..."}
            {saveStatus === "saved" && "이미 저장되었습니다"}
            {saveStatus === "idle" && "커리어 보관함에 저장"}
          </button>
        </div>

        <BenchmarkExplorer
          jobOptions={jobOptions}
          levelOptions={levelOptions}
          selectedJobCategoryId={selectedJobCategoryId}
          selectedExperienceLevelId={selectedExperienceLevelId}
          selectedWorkFormat={selectedWorkFormat}
          customAmount={customAmount}
          isLoading={isBenchmarkLoading}
          onJobChange={setSelectedJobCategoryId}
          onLevelChange={setSelectedExperienceLevelId}
          onWorkFormatChange={setSelectedWorkFormat}
          onAmountChange={setCustomAmount}
        />

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="시장 중앙 단가"
            value={benchmark?.median != null ? `${benchmark.median}만원` : "-"}
            caption="유사 조건 월 환산 기준"
          />
          <StatCard
            label="데이터 신뢰도"
            value={benchmark?.n != null ? `${benchmark.n}건` : "-"}
            caption={reliability.label}
          />
          <StatCard
            label="내 월 환산 단가"
            value={userPosition}
            caption={latestSubmission?.amountUnit === "TOTAL" ? "총액을 기간 기준으로 환산" : "입력 월 단가 기준"}
          />
        </div>

        {/* Insight banner */}
        <div className="mt-5 rounded-xl bg-gradient-to-r from-main25 to-[#DAEDFF] px-5 py-4 text-sm text-bodyfont1">
          {userProfile?.nickname}님과 연차가 비슷한{" "}
          {selectedJobLabel ?? ""} 디자이너들 중,{" "}
          {userProfile?.nickname}님의 단가는{" "}
          <span className="font-bold text-main100">{percentile}</span> 입니다.
          <span className="ml-2">{marketInsight}</span>
        </div>

        <div className="mt-5">
          <PercentileBand benchmark={benchmark} userAmount={userBenchmarkAmount} />
        </div>

        <div className="mt-5">
          <TrendCard submissions={submissions} />
        </div>

        {/* Bar chart */}
        <div className="mt-6">
          <BarChart
            data={barData}
            yTicks={yTicks}
            maxValue={yMax}
            median={benchmark?.median ?? null}
            totalN={benchmark?.n ?? 0}
          />
        </div>

        {/* Bottom CTA */}
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#E5E5E5]/60 px-6 py-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-main100">
              내 건별 단가 시장 위치를 확인하셨나요?
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              이제 이 기준으로 클라이언트에게 보낼 세부 견적을 뽑아보세요!
            </p>
          </div>
          <Link
            href="/estimate"
            className="shrink-0 rounded-xl border-1 border-main100 px-10 py-3 text-sm font-semibold text-main100 transition hover:bg-main100 hover:text-white">
            내 스펙으로 실전 견적 계산하기
          </Link>
        </div>
      </main>

      {/* Project name modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
            <button
              onClick={() => {
                setShowProjectModal(false);
                setProjectName("");
              }}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-titlefont1 mb-2">내 단가 기록 저장하기</h2>
            <p className="text-sm text-bodyfont3 mb-6">
              이 분석 결과를 나중에 찾을 수 있도록 이름을 붙여 분류에 옮겨두세요.
            </p>

            <div className="mb-8">
              <label className="block text-sm font-bold text-titlefont1 mb-3">
                프로젝트명
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="프로젝트명 입력"
                className="w-full rounded-lg bg-gray-100 px-4 py-3 text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:ring-main100"
              />
            </div>

            <div className="mb-8 rounded-lg bg-gray-50 px-5 py-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-bodyfont3">직군</span>
                <span className="font-medium text-titlefont1">{userProfile?.jobCategoryName || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-bodyfont3">경력</span>
                <span className="font-medium text-titlefont1">{userProfile?.experienceLevelLabel || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-bodyfont3">계약방식</span>
                <span className="font-medium text-titlefont1">{workFormatLabel(latestSubmission?.workFormat)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-bodyfont3">내 단가</span>
                <span className="font-medium text-titlefont1">{userPosition}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveWithProject}
                disabled={saveStatus === "saving" || !projectName.trim()}
                className="flex-1 rounded-2xl bg-main100 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveStatus === "saving" ? "저장 중..." : "저장하기"}
              </button>
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  setProjectName("");
                }}
                className="flex-1 rounded-2xl border-2 border-neutral-200 px-4 py-3 text-sm font-semibold text-titlefont1 transition hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
