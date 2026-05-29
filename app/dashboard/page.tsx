"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Topbar from "@/components/topbar";
import Image from "next/image";
import { userAPI, benchmarkAPI, careerSaveAPI } from "@/lib/api";

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
  median: number | null;
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
  jobCategoryName: string;
  submissionType: string;
}

interface BarData {
  range: string;
  value: number;
  isUser?: boolean;
  bucket?: DistributionBucket;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <p className="text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
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
        디자이너 {bucket.count}명{pct != null ? ` · 전체의 ${pct}%` : ""}
      </p>
      {bucket.cohortSize != null && bucket.certHoldersCount != null && (
        <p className="text-main100 font-medium mt-0.5">
          {bucket.cohortSize}명 중 {bucket.certHoldersCount}명이 자격증 보유
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
  const BAR_HEIGHT = 260;

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

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
        const [profile, submissions] = await Promise.all([
          userAPI.getProfile(userId),
          userAPI.getSubmissions(userId),
        ]);

        const latest: SubmissionItem | null = submissions?.[0] ?? null;
        setUserProfile(profile);
        setLatestSubmission(latest);

        // localStorage에 저장된 ID 목록 중 하나라도 서버에 존재하면 "저장됨"
        const raw = localStorage.getItem("careerSavedIds");
        const savedIds: number[] = raw ? JSON.parse(raw) : [];
        if (savedIds.length > 0) {
          const checks = await Promise.allSettled(
            savedIds.map((id) => careerSaveAPI.getById(id))
          );
          const surviving = savedIds.filter((_, i) => checks[i].status === "fulfilled");
          if (surviving.length !== savedIds.length) {
            localStorage.setItem("careerSavedIds", JSON.stringify(surviving));
          }
          if (surviving.length > 0) setSaveStatus("saved");
        }

        if (!profile.jobCategoryId) {
          setBenchmark(null);
          setIsLoading(false);
          return;
        }

        const result = await benchmarkAPI.get({
          jobCategoryId: profile.jobCategoryId,
          experienceLevelId: profile.experienceLevelId ?? undefined,
          workFormat: latest?.workFormat ?? undefined,
          userAmount: latest?.amount ?? undefined,
        });

        setBenchmark(result);
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

  const handleSave = async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
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
      });
      const raw = localStorage.getItem("careerSavedIds");
      const ids: number[] = raw ? JSON.parse(raw) : [];
      if (!ids.includes(result.id)) ids.push(result.id);
      localStorage.setItem("careerSavedIds", JSON.stringify(ids));
      setSaveStatus("saved");
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

  const tags = [
    userProfile?.jobCategoryName,
    userProfile?.experienceLevelLabel,
    latestSubmission?.amountUnit === "MONTHLY" ? "월 단위 계약" : "건별 외주 계약",
  ].filter(Boolean) as string[];

  const barData: BarData[] = (benchmark?.distribution ?? []).map((b) => {
    const userInBucket =
      latestSubmission != null &&
      latestSubmission.amount >= b.rangeStart &&
      latestSubmission.amount < b.rangeEnd;
    return {
      range: `${b.rangeStart}-${b.rangeEnd}`,
      value: Number(b.count),
      isUser: userInBucket,
      bucket: b,
    };
  });

  const rawMax = barData.length > 0 ? Math.max(...barData.map((b) => b.value), 1) : 250;
  const yMax = Math.ceil(rawMax / 50) * 50;
  const yTicks = Array.from({ length: 6 }, (_, i) => Math.round((yMax / 5) * i));

  const userBucket = barData.find((b) => b.isUser);
  const userPosition = userBucket
    ? `${userBucket.range}만원`
    : latestSubmission
      ? `${latestSubmission.amount}만원`
      : "-";

  const percentile =
    benchmark?.userPercentile != null
      ? `하위 ${benchmark.userPercentile}%`
      : "-";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <Topbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 md:px-8">
        <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
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
            className="flex items-center gap-1.5 rounded-lg border border-main100 px-4 py-2 text-sm font-semibold text-main100 transition hover:bg-main25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Image src="/save.svg" alt="" width={15} height={20} />
            {saveStatus === "saving" && "저장 중..."}
            {saveStatus === "saved" && "저장되었습니다 ✓"}
            {saveStatus === "idle" && "커리어 보관함에 저장"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="시장 평균 단가"
            value={benchmark?.median != null ? `${benchmark.median}만원` : "-"}
          />
          <StatCard
            label="데이터 샘플 수"
            value={benchmark?.n != null ? `${benchmark.n}건` : "-"}
          />
          <StatCard label="내 위치" value={userPosition} />
        </div>

        {/* Insight banner */}
        <div className="mt-5 rounded-xl bg-gradient-to-r from-main25 to-[#DAEDFF] px-5 py-4 text-sm text-bodyfont1">
          {userProfile?.nickname}님과 연차가 비슷한{" "}
          {userProfile?.jobCategoryName ?? ""} 디자이너들 중,{" "}
          {userProfile?.nickname}님의 단가는{" "}
          <span className="font-bold text-main100">{percentile}</span> 입니다.
          협상의 여지가 있어 보여요!
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
    </div>
  );
}
