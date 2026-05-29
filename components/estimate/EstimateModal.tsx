// components/estimate/EstimateModal.tsx

import { DELIVERABLE_OPTIONS } from "@/lib/estimate/constants";

interface Props {
  estimate: number;
  screens: string;
  scopeMultiplier: number;
  platformMultiplier: number;
  afterScope: number;
  afterPlatform: number;
  basePrice: number;
  deliverables: string[];
  onClose: () => void;
}

export default function EstimateModal({
  estimate, screens, scopeMultiplier, platformMultiplier,
  afterScope, afterPlatform, basePrice, deliverables, onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white px-8 py-8 shadow-xl">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-titlefont1"><span className="text-main100 text-2xl">User</span>님의 견적서</h2>
          <button
            onClick={onClose}
            className="text-bodyfont4 hover:text-titlefont1 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex justify-between items-center rounded-xl px-5 py-4 mb-6" style={{ background: "linear-gradient(135deg, #e8e0ff 0%, #d6e8ff 40%, #c8f0ff 70%, #dde0ff 100%)" }}>
          <span className="text-sm text-bodyfont2">권장 최소 방어 견적</span>
          <span className="text-lg font-bold text-main100">₩{estimate.toLocaleString()}만 원</span>
        </div>

        <div className="rounded-xl bg-gray-50 px-5 flex flex-col text-sm text-bodyfont2 mb-8">
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span>기본 작업비</span>
            <span>{screens}화면 x 100만 원 = {basePrice.toLocaleString()}만 원</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span>UX 기획 관여도</span>
            <span>x{scopeMultiplier} = {afterScope.toLocaleString()}만 원</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span>플랫폼 배수</span>
            <span>x{platformMultiplier} = {afterPlatform.toLocaleString()}만 원</span>
          </div>
          {deliverables.map((d) => {
            const bonus = DELIVERABLE_OPTIONS.find((o) => o.label === d)?.bonus ?? 0;
            return (
              <div key={d} className="flex justify-between py-3">
                <span>{d}</span>
                <span>+{Math.round(afterPlatform * bonus).toLocaleString()}만 원 (+{bonus * 100}%)</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button className="flex-1 rounded-2xl bg-gradient-to-r from-main100 to-sub175 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all cursor-pointer">
            내 보관함에 저장하기
          </button>
          <button className="flex-1 rounded-2xl border border-main100 py-3 text-sm font-semibold text-main100 hover:bg-main25 transition-all cursor-pointer">
            이미지로 저장하기
          </button>
        </div>

      </div>
    </div>
  );
}