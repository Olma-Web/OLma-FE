"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/topbar";

const AVATAR_LABELS = ["A", "B", "C", "D", "E"] as const;

export default function Home() {
  const router = useRouter();
  const [toast, setToast] = useState(false);

  const handleAnalyze = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setToast(true);
      setTimeout(() => setToast(false), 2500);
      return;
    }
    router.push("/onboarding");
  };

  return (
    <>
      {/* Toast - 최상위에 렌더링되어 fixed positioning 제약 없음 */}
      {toast && (
        <div className="fixed left-1/2 top-1/6 z-[100] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
          로그인 후 이용할 수 있어요
        </div>
      )}

      <div className="relative isolate flex w-full flex-col font-sans">
        <div className="bg-home-background-layer pointer-events-none" aria-hidden />

        {/* Hero Section */}
        <div className="relative z-10 flex min-h-screen flex-col">
          <Topbar />
          <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-6 md:px-8 md:pb-32 md:pt-10">
            <p className="mb-5 max-w-2xl text-center text-sm leading-relaxed text-neutral-600 md:mb-6 md:text-[15px]">
              정보 비대칭 해소부터 실전 견적 계산까지, Olma와 함께!
            </p>

            <h1 className="mb-9 max-w-[min(100%,24rem)] text-center text-[1.65rem] font-bold leading-snug tracking-tight text-neutral-900 sm:max-w-2xl sm:text-3xl md:mb-10 md:max-w-4xl md:text-4xl lg:text-[2.65rem] lg:leading-[1.25]">
              나의{" "}
              <span className="inline-block bg-gradient-to-r from-hero-accent1 to-main50 bg-clip-text text-transparent">
                진짜 시장 가치,
              </span>
              <br />
              궁금하지 않으신가요?
            </h1>

          <button
            onClick={handleAnalyze}
            className="mb-11 inline-flex items-center gap-2 rounded-xl bg-main100 px-15 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-8px_rgba(69,78,255,0.45)] transition hover:brightness-105"
          >
            내 단가 분석하기
            <span aria-hidden className="translate-y-px items-center">
              {">"}
            </span>
          </button>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <div className="flex -space-x-2.5" aria-hidden>
              {AVATAR_LABELS.map((label) => (
                <div
                  key={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-500 shadow-sm ring-2 ring-white md:h-11 md:w-11"
                >
                  {label}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-neutral-600 md:text-[15px]">
              <span className="font-semibold text-neutral-900">5,000+</span>{" "}
              디자이너가 이미 분석 완료
            </p>
          </div>
        </main>
      </div>

      {/* "왜 Olma 인가요?" Section */}
      <section className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto flex max-w-6xl flex-col items-center">
            <h2 className="mb-12 flex items-center justify-center gap-2 text-center text-2xl font-bold text-main100 md:text-3xl">
              왜<img src="/logo.svg" alt="Olma" className="h-8 md:h-10" /> 인가요?
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
              {[
                {
                  icon: "icon_1",
                  title: "시장 단가 진단",
                  description: "실제 프리랜서 프로젝트 데이터를 기반으로 \n 정확한 시장 단가를 제공합니다.",
                },
                {
                  icon: "icon_2",
                  title: "스마트 견적 처방",
                  description: "당신의 경력과 기술 스택을 고려한 \n 맞춤형 견적 계산을 제공합니다.",
                },
                {
                  icon: "icon_3",
                  title: "네트워킹 및 교류",
                  description: "같은 업계 디자이너들과 정보를 공유하고 네트워킹하세요.",
                },
                {
                  icon: "icon_4",
                  title: "가치 변화 트래킹",
                  description: "시간이 지남에 따라 당신의 시장 가치 변화를 \n 추적하고 성장 전략을 세우세요.",
                },
              ].map((item) => (
                <div
                  key={item.icon}
                  className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-[#E0DDFF] to-[#DAEDFF] p-6 px-8 py-8 md:p-8"
                  style={{ boxShadow: "0px 2px 18px rgba(177, 205, 230, 0.7)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={`/${item.icon}.svg`}
                        alt={item.title}
                        className="h-4 w-4 md:h-6 md:w-6"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-main125 md:text-xl">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-bodyfont1 md:text-[15px] whitespace-pre-line">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Review Section */}
        <section className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl w-full flex items-center justify-center">
            <img
              src="/review-section.png"
              alt="디자이너들의 실제 이용 후기"
              className="w-full max-w-5xl h-auto"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 w-full bg-[#D6E9FF] bg-[url(/img4.svg)] bg-no-repeat bg-left-top bg-[length:200px_200px] md:bg-[length:300px_300px] px-4 py-12 md:px-8 md:py-16">
          <div className="flex flex-col items-center justify-center">
            <div className="mx-auto max-w-6xl w-full flex flex-col items-center justify-center">
              {/* Title */}
              <h2 className="mb-8 text-2xl md:text-4xl font-bold text-neutral-900 leading-tight max-w-2xl text-center">
                지금 바로 시작하세요.
                <br />
                디자이너님의 진짜 가치를 확인하세요!
              </h2>

              {/* CTA Button and Stats */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                <button
                  onClick={handleAnalyze}
                  className="rounded-md bg-main100 px-12 md:px-16 py-3 text-base font-bold text-white shadow-lg hover:brightness-110 transition-all whitespace-nowrap"
                >
                  무료로 단가 분석하기
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {AVATAR_LABELS.map((label) => (
                      <div
                        key={label}
                        className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-main75 to-main100 text-xs font-bold text-white shadow-md"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-base md:text-lg font-bold text-main100">5,000+</p>
                    <p className="text-xs text-neutral-600">디자이너 분석 완료</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 w-full bg-[#3A3A3A] px-2 py-8 md:px-8 md:py-10">
            <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-xs md:text-sm text-bodyfont3 text-center md:text-left">
                <p>정보 비대칭 해소부터 실전 견적 계산까지,</p>
                <p>디자이너를 위한 시장 단가 분석 서비스</p>
                <p className="mt-2">© Olma All rights reserved.</p>
              </div>
              <img
                src="/logo.svg"
                alt="Olma"
                className="h-9 md:h-10 flex-shrink-0"
              />
            </div>
        </footer>
      </div>
    </>
  );
}
