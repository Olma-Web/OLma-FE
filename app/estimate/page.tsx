"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import Link from "next/link";
import Topbar from "@/components/topbar";
import EstimateModal from "@/components/estimate/EstimateModal";
import { estimateAPI, userAPI } from "@/lib/api";
import {
  WORK_SCOPE_OPTIONS,
  PLATFORM_OPTIONS,
  DELIVERABLE_OPTIONS,
} from "@/lib/estimate/constants";

// --- API enum 매핑 ---
const UX_ENGAGEMENT_MAP: Record<string, "GUI_ONLY" | "WIREFRAME_PLUS" | "FULL_PLANNING"> = {
  "기획서 100% 완료 (GUI만 작업)": "GUI_ONLY",
  "와이어프레임 기반 UX 고도화 + GUI": "WIREFRAME_PLUS",
  "초기 아이디어부터 UX/UI 전체 기획": "FULL_PLANNING",
};

const PLATFORM_ENV_MAP: Record<string, "MOBILE_APP" | "PC_WEB" | "RESPONSIVE_WEB"> = {
  "모바일 앱 (iOS/Android)": "MOBILE_APP",
  "일반 PC 웹": "PC_WEB",
  "반응형 웹 (PC+태블릿+모바일)": "RESPONSIVE_WEB",
};

const ADDON_MAP: Record<string, "DESIGN_SYSTEM" | "PROTOTYPING" | "SOURCE_TRANSFER"> = {
  "개발자용 디자인 시스템 구축": "DESIGN_SYSTEM",
  "화면 프로토타이핑": "PROTOTYPING",
  "Figma 등 원본 소스 전송": "SOURCE_TRANSFER",
};

type WorkScope = typeof WORK_SCOPE_OPTIONS[number]["label"];
type Platform = typeof PLATFORM_OPTIONS[number]["label"];
type Deliverable = typeof DELIVERABLE_OPTIONS[number]["label"];

export default function EstimatePage() {
  const [screens, setScreens] = useState("");
  const [workScope, setWorkScope] = useState<WorkScope | "">("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const [spec, setSpec] = useState({ jobCategoryName: "", experienceLevelLabel: "" });
  const [jobCategoryId, setJobCategoryId] = useState<number | null>(null);
  const [experienceLevelId, setExperienceLevelId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const userId = Number(localStorage.getItem("userId"));
    if (!userId) return;

    userAPI.getProfile(userId).then((data) => {
      if (data) {
        setSpec({
          jobCategoryName: data.jobCategoryName ?? "",
          experienceLevelLabel: data.experienceLevelLabel ?? "",
        });
        setJobCategoryId(data.jobCategoryId ?? null);
        setExperienceLevelId(data.experienceLevelId ?? null);
      }
    }).catch(() => {});
  }, []);

  const toggleDeliverable = (label: Deliverable) => {
    setDeliverables((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  const isActive = screens.length > 0 && workScope !== "" && platform !== "";

  const handleCalculate = async () => {
    if (!isActive || !jobCategoryId || !experienceLevelId) return;
    setIsLoading(true);

    try {
      const data = await estimateAPI.calculate({
        experienceLevelId,
        jobCategoryId,
        screenCount: Number(screens),
        uxEngagement: UX_ENGAGEMENT_MAP[workScope],
        platformEnvironment: PLATFORM_ENV_MAP[platform],
        addons: deliverables.map((d) => ADDON_MAP[d]),
      });
      setResult(data);
      setShowModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "서버에 연결할 수 없어요");
    } finally {
      setIsLoading(false);
    }
  };

  const optionClass = (selected: boolean) =>
    `w-full text-left px-5 py-3 rounded-xl border text-sm transition-all cursor-pointer flex justify-between items-center ${
      selected
        ? "bg-main25 border-main100 text-main100"
        : "bg-white border-line1 text-titlefont2"
    }`;

  return (
    <div className="min-h-screen font-sans bg-estimate">
      <Topbar />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-titlefont1">스마트 견적 계산기</h1>
          <p className="mt-1 text-sm text-bodyfont3">실전 프로젝트에 맞는 정확한 견적을 산출하세요.</p>
        </div>

        {/* 현재 등록된 스펙 */}
        <div className="rounded-2xl bg-bg2 px-6 py-4 mb-8 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-bodyfont3 shrink-0">현재 등록된 스펙</span>
          {spec.jobCategoryName && (
            <span className="rounded-full bg-main25 px-3 py-1 text-xs font-medium text-main100">
              {spec.jobCategoryName}
            </span>
          )}
          {spec.experienceLevelLabel && (
            <span className="rounded-full bg-main25 px-3 py-1 text-xs font-medium text-main100">
              {spec.experienceLevelLabel}
            </span>
          )}
          <Link
            href="/onboarding"
            className="ml-auto flex items-center gap-1 rounded-lg border border-main100 px-2 py-1.5 text-xs text-main100 hover:bg-main25 transition-colors"
          >
            <Pencil size={12} />
            <span>수정하기</span>
          </Link>
        </div>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-[0_8px_32px_rgba(0,0,0,0.10)] flex flex-col gap-8">

          {/* 1번 질문 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">
              1. 대략적인 총 작업 화면(핵심 메인 화면 기준) 수는 몇 장인가요?
            </p>
            <input
              type="number"
              value={screens}
              onChange={(e) => setScreens(e.target.value)}
              placeholder="화면 수를 입력해주세요"
              className="w-full rounded-lg border border-line1 bg-bg2 px-5 py-3 text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:border-main75 focus:ring-main25 transition-all"
            />
          </div>

          {/* 2번 질문 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">
              2. 이번 프로젝트, 어디서부터 작업하시나요?
            </p>
            <div className="flex flex-col gap-2">
              {WORK_SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setWorkScope(option.label)}
                  className={optionClass(workScope === option.label)}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-bodyfont3">x{option.multiplier}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3번 질문 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">
              3. 어떤 환경에 맞춰 디자인하시나요?
            </p>
            <div className="flex flex-col gap-2">
              {PLATFORM_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setPlatform(option.label)}
                  className={optionClass(platform === option.label)}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-bodyfont3">x{option.multiplier}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4번 질문 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">
              4. 클라이언트에게 어떤 것까지 넘겨주시나요?
            </p>
            <div className="flex flex-col gap-2">
              {DELIVERABLE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => toggleDeliverable(option.label)}
                  className={optionClass(deliverables.includes(option.label))}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      deliverables.includes(option.label)
                        ? "border-main100 bg-main100"
                        : "border-line1"
                    }`}>
                      {deliverables.includes(option.label) && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                    {option.label}
                  </span>
                  <span className="text-xs text-bodyfont3">+{option.bonus * 100}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* 견적 계산하기 버튼 */}
          <button
            onClick={handleCalculate}
            disabled={!isActive || isLoading}
            className={`w-full rounded-xl py-4 text-sm font-semibold text-white transition-all ${
              isActive && !isLoading
                ? "bg-gradient-to-r from-main100 to-sub175 hover:brightness-105 cursor-pointer"
                : "bg-line1 text-bodyfont4 cursor-not-allowed"
            }`}
          >
            {isLoading ? "계산 중..." : "견적 계산하기"}
          </button>

        </div>
      </div>

      {/* 결과 모달 */}
      {showModal && result && (
        <EstimateModal
          result={result}
          onClose={() => setShowModal(false)}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onSave={(name) =>
            estimateAPI.save({
              experienceLevelId: experienceLevelId!,
              jobCategoryId: jobCategoryId!,
              screenCount: Number(screens),
              uxEngagement: UX_ENGAGEMENT_MAP[workScope as string],
              platformEnvironment: PLATFORM_ENV_MAP[platform as string],
              addons: deliverables.map((d) => ADDON_MAP[d]),
              projectName: name,
            })
          }
        />
      )}
    </div>
  );
}