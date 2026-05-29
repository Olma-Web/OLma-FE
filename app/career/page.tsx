"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import Topbar from "@/components/topbar";
import { userAPI, submissionDeleteAPI, careerSaveAPI } from "@/lib/api";

interface UserProfile {
  nickname: string;
  jobCategoryName: string | null;
  experienceLevelLabel: string | null;
  certificates: { id: number; name: string }[];
}

interface SubmissionItem {
  id: number;
  jobCategoryName: string;
  experienceLevelLabel: string;
  workFormat: string;
  submissionType: string;
  amount: number;
  amountUnit: string;
  createdAt: string;
}

interface EstimateItem {
  id: number;
  projectName?: string;
  screenCount: number;
  baseAmount: number;
  uxMultiplier: number;
  platformMultiplier: number;
  addons: string[];
  addonPercent: number;
  finalAmount: number;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

function workFormatLabel(format: string): string {
  if (format === "REMOTE") return "원격";
  if (format === "ON_SITE") return "상주";
  if (format === "HYBRID") return "혼합";
  return format;
}

function amountUnitLabel(unit: string): string {
  if (unit === "MONTHLY") return "월단위";
  if (unit === "TOTAL") return "건별";
  return unit;
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    const rest = amount % 10000;
    return rest > 0 ? `₩${man}억 ${rest}만 원` : `₩${man}억 원`;
  }
  return `₩${amount}만 원`;
}

export default function CareerPage() {
  const [tab, setTab] = useState<"rates" | "estimates">("rates");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [estimates, setEstimates] = useState<EstimateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserId = () => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("userId");
    const id = Number(raw);
    return Number.isNaN(id) || !id ? null : id;
  };

  const loadData = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setError("로그인이 필요합니다.");
      setIsLoading(false);
      return;
    }

    try {
      const profileData = await userAPI.getProfile(userId);
      setProfile(profileData);

      // localStorage에 저장된 ID들만 개별 조회
      const raw = localStorage.getItem("careerSavedIds");
      const savedIds: number[] = raw ? JSON.parse(raw) : [];
      if (savedIds.length > 0) {
        const results = await Promise.allSettled(
          savedIds.map((id) => careerSaveAPI.getById(id))
        );
        const valid = results
          .map((r, i) => ({ r, id: savedIds[i] }))
          .filter(({ r }) => r.status === "fulfilled")
          .map(({ r }) => (r as PromiseFulfilledResult<SubmissionItem>).value);
        const survivingIds = results
          .map((r, i) => ({ r, id: savedIds[i] }))
          .filter(({ r }) => r.status === "fulfilled")
          .map(({ id }) => id);
        localStorage.setItem("careerSavedIds", JSON.stringify(survivingIds));
        setSubmissions(valid);
      } else {
        setSubmissions([]);
      }

      setEstimates([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없어요.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteSubmission = async (id: number) => {
    await submissionDeleteAPI.delete(id);
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    const raw = localStorage.getItem("careerSavedIds");
    const ids: number[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem("careerSavedIds", JSON.stringify(ids.filter((i) => i !== id)));
  };

  const deleteEstimate = async (id: number) => {
    setEstimates((prev) => prev.filter((e) => e.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7c6ff7] border-t-transparent" />
          <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Topbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const certLabel = profile?.certificates?.length
    ? profile.certificates.map((c) => c.name).join(", ")
    : "자격증 없음";

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Topbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
        <h1 className="text-2xl font-extrabold text-gray-900">커리어 관리</h1>
        <p className="mt-2 text-sm text-gray-500">
          나의 커리어 가치가 기록되는 곳. 나의 시장 가치를 증명하는 단가와 견적 히스토리를 체계적으로 관리하세요.
        </p>

        {/* 프로필 카드 */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900">{profile?.nickname ?? "User"} 님</p>
            </div>
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 rounded-lg border border-main100 px-3 py-1.5 text-xs font-semibold text-main100 transition hover:bg-[#f3f1ff]"
            >
              <Pencil size={12} />
              스펙 업데이트
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">직군</span>
              <span className="font-bold text-gray-900">{profile?.jobCategoryName ?? "미설정"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">경력</span>
              <span className="font-bold text-gray-900">{profile?.experienceLevelLabel ?? "미설정"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">자격증</span>
              <span className="font-bold text-gray-900">{certLabel}</span>
            </span>
          </div>
        </div>

        {/* 탭 */}
        <div className="mt-6 flex border-b border-gray-200">
          <button
            onClick={() => setTab("rates")}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === "rates"
                ? "border-b-2 border-main100 text-main100"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            내 단가 기록
          </button>
          <button
            onClick={() => setTab("estimates")}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === "estimates"
                ? "border-b-2 border-main100 text-main100"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            견적서 보관함
          </button>
        </div>

        {/* 탭 1: 단가 기록 */}
        {tab === "rates" && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">단가 기록</h2>
              <span className="rounded-sm bg-sub50 px-2 py-0.5 text-xs font-semibold text-sub175">
                실제 데이터
              </span>
            </div>

            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <p className="text-sm text-gray-400">아직 등록된 단가 기록이 없습니다.</p>
                <Link
                  href="/onboarding"
                  className="mt-4 inline-block rounded-xl bg-main100 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-main75"
                >
                  단가 등록하기
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {submissions.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl bg-[#F5F5F5] px-5 py-6"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-500">직군</span>
                          <span className="font-bold text-gray-900">{item.jobCategoryName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-500">경력</span>
                          <span className="font-bold text-gray-900">{item.experienceLevelLabel}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-500">근무</span>
                          <span className="font-bold text-gray-900">{workFormatLabel(item.workFormat)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-gray-500">계약</span>
                          <span className="font-bold text-gray-900">{amountUnitLabel(item.amountUnit)}</span>
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-5">
                        <p className="text-base font-bold text-main100">
                          {formatAmount(item.amount)}
                        </p>
                        <button
                          onClick={() => deleteSubmission(item.id)}
                          className="flex items-center gap-1 rounded-lg border border-main100 px-2.5 py-1.5 text-xs text-main100 transition hover:bg-[#f3f1ff]"
                        >
                          <Trash2 size={12} />
                          삭제하기
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 탭 2: 견적서 보관함 */}
        {tab === "estimates" && (
          <div className="mt-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900">견적서</h2>
            </div>

            {estimates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <p className="text-sm text-gray-400">아직 저장된 견적서가 없습니다.</p>
                <Link
                  href="/estimate"
                  className="mt-4 inline-block rounded-xl bg-main100 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-main75"
                >
                  내 스펙으로 실전 견적 계산하기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {estimates.map((est) => {
                  const baseWork = est.screenCount * est.baseAmount;
                  const afterUx = Math.round(baseWork * est.uxMultiplier);
                  const afterPlatform = Math.round(afterUx * est.platformMultiplier);
                  const addonAmount = Math.round(afterPlatform * (est.addonPercent / 100));

                  return (
                    <div
                      key={est.id}
                      className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {est.projectName ?? "견적서"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">{timeAgo(est.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => deleteEstimate(est.id)}
                          className="flex shrink-0 items-center gap-1 rounded-lg border border-[#7c6ff7] px-2.5 py-1 text-xs text-[#7c6ff7] transition hover:bg-[#f3f1ff]"
                        >
                          <Trash2 size={12} />
                          삭제하기
                        </button>
                      </div>

                      <div className="mt-4 flex flex-col gap-1.5 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>기본 작업비</span>
                          <span>{est.screenCount}회 × {est.baseAmount}만 원 = {baseWork}만 원</span>
                        </div>
                        <div className="flex justify-between">
                          <span>UX 기획 가이드</span>
                          <span>x{est.uxMultiplier} = {afterUx}만 원</span>
                        </div>
                        <div className="flex justify-between">
                          <span>플랫폼 배수</span>
                          <span>x{est.platformMultiplier} = {afterPlatform}만 원</span>
                        </div>
                        {est.addonPercent > 0 && (
                          <div className="flex justify-between">
                            <span>추가 옵션</span>
                            <span>+{addonAmount}만 원 (+{est.addonPercent}%)</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">경쟁 최소 방어 견적</span>
                        <span className="text-base font-bold text-[#7c6ff7]">
                          {formatAmount(est.finalAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
