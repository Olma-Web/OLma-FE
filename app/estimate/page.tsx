"use client";

import { useState } from "react";
import Topbar from "@/components/topbar";
import EstimateModal from "@/components/estimate/EstimateModal";
import {
  BASE_PRICE_PER_SCREEN,
  WORK_SCOPE_OPTIONS,
  PLATFORM_OPTIONS,
  DELIVERABLE_OPTIONS,
  MOCK_SPEC,
} from "@/lib/estimate/constants";

type WorkScope = typeof WORK_SCOPE_OPTIONS[number]["label"];
type Platform = typeof PLATFORM_OPTIONS[number]["label"];
type Deliverable = typeof DELIVERABLE_OPTIONS[number]["label"];

export default function EstimatePage() {
  const [screens, setScreens] = useState("");
  const [workScope, setWorkScope] = useState<WorkScope | "">("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [showModal, setShowModal] = useState(false);

  const toggleDeliverable = (label: Deliverable) => {
    setDeliverables((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  const isActive = screens.length > 0 && workScope !== "" && platform !== "";

  const scopeMultiplier = WORK_SCOPE_OPTIONS.find((o) => o.label === workScope)?.multiplier ?? 1;
  const platformMultiplier = PLATFORM_OPTIONS.find((o) => o.label === platform)?.multiplier ?? 1;
  const bonusMultiplier = deliverables.reduce((acc, d) => {
    return acc + (DELIVERABLE_OPTIONS.find((o) => o.label === d)?.bonus ?? 0);
  }, 0);

  const basePrice = Number(screens) * BASE_PRICE_PER_SCREEN;
  const afterScope = Math.round(basePrice * scopeMultiplier);
  const afterPlatform = Math.round(afterScope * platformMultiplier);
  const estimate = Math.round(afterPlatform * (1 + bonusMultiplier));

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
        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-bodyfont3 shrink-0">현재 등록된 스펙</span>
          <span className="rounded-full bg-main25 px-3 py-1 text-xs font-medium text-main100">
            {MOCK_SPEC.jobCategory}
          </span>
          <span className="rounded-full bg-main25 px-3 py-1 text-xs font-medium text-main100">
            {MOCK_SPEC.experienceLevel}
          </span>
          <button className="ml-auto flex items-center gap-1 text-xs text-bodyfont3 hover:text-main100 transition-colors">
            <span>✏️</span>
            <span>수정하기</span>
          </button>
        </div>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-lg flex flex-col gap-8">

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
            onClick={() => setShowModal(true)}
            disabled={!isActive}
            className={`w-full rounded-xl py-4 text-sm font-semibold text-white transition-all ${
              isActive
                ? "bg-gradient-to-r from-main100 to-sub175 hover:brightness-105 cursor-pointer"
                : "bg-line1 text-bodyfont4 cursor-not-allowed"
            }`}
          >
            견적 계산하기
          </button>

        </div>
      </div>

      {/* 결과 모달 */}
      {showModal && (
        <EstimateModal
          estimate={estimate}
          screens={screens}
          scopeMultiplier={scopeMultiplier}
          platformMultiplier={platformMultiplier}
          afterScope={afterScope}
          afterPlatform={afterPlatform}
          basePrice={basePrice}
          deliverables={deliverables}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}