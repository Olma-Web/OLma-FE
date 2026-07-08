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

          {toast && (
            <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg">
              로그인 후 이용할 수 있어요
            </div>
          )}

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
                  description: "실제 프리랜서 들로부터 정확한 시장 단가를 제공합니다.",
                },
                {
                  icon: "icon_2",
                  title: "스마트 견적 처방",
                  description: "당신의 경력과 기술 스택을 통한 맞춤형 견적 제시와 제공합니다.",
                },
                {
                  icon: "icon_3",
                  title: "네트워킹 및 교류",
                  description: "같은 업계 디자이너들의 실전 경험을 듣고 네트워킹하세요.",
                },
                {
                  icon: "icon_4",
                  title: "가치 변화 트래킹",
                  description: "시간이 지나며 당신의 시장 가치 변화를 \n 추적하고 성장을 기록하세요.",
                },
              ].map((item) => (
                <div
                  key={item.icon}
                  className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-[#E0DDFF] to-[#DAEDFF] shadow-md p-6 px-8 py-8 md:p-8"
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
                  <p className="text-sm text-neutral-600 md:text-[15px]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Review Section */}
        <section className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-neutral-50 to-white px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl w-full">
            {/* Title */}
            <div className="absolute right-8 top-20 md:right-16 md:top-24">
              <h2 className="text-xl font-bold text-main100 md:text-2xl">
                디자이너들의 실제 이용 후기
              </h2>
            </div>

            {/* Left Quote */}
            <div className="absolute left-4 top-24 text-6xl text-main50 opacity-40 md:left-8 md:top-32 md:text-8xl">
              "
            </div>

            {/* Reviews Layout - Overlapping */}
            <div className="relative h-96 w-full md:h-80">
              {[
                {
                  name: "김민지",
                  role: "UX/UI 디자이너",
                  image: "img1",
                  rating: 5,
                  text: "Olma 덕분에 제 실력에 맞는 정확한 단가를 알게 됐어요. 클라이언트와의 협상이 훨씬 쉬워졌습니다!",
                  top: "0",
                  left: "0",
                  zIndex: 10,
                },
                {
                  name: "박준우",
                  role: "UX/UI 디자이너",
                  image: "img2",
                  rating: 5,
                  text: "시장 데이터를 근거로 협상할 수 있으니 나도한디라고. 이제 당신에 자신감이 생겼습니다.",
                  top: "auto",
                  bottom: "0",
                  left: "0",
                  zIndex: 5,
                },
                {
                  name: "이서연",
                  role: "UX/UI 디자이너",
                  image: "img3",
                  rating: 5,
                  text: "커뮤니티에서 다른 디자이너들의 실전 경험을 듣고 많은 도움을 받았어요. Olma는 단순 툴 이상이에요.",
                  top: "50%",
                  right: "0",
                  zIndex: 15,
                },
              ].map((review, index) => (
                <div
                  key={review.name}
                  className="absolute w-full max-w-sm md:max-w-md"
                  style={{
                    top: review.top,
                    bottom: review.bottom,
                    left: review.left,
                    right: review.right,
                    zIndex: review.zIndex,
                    transform: review.top === "50%" ? "translateY(-50%)" : undefined,
                  }}
                >
                  <div className={`flex gap-4 w-full ${index === 1 ? "flex-row-reverse" : ""}`}>
                    {/* Profile */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <img
                        src={`/${review.image}.png`}
                        alt={review.name}
                        className="h-16 w-16 rounded-full border-4 border-main100 object-cover"
                      />
                      <h3 className="text-sm font-bold text-titlefont1 text-center">{review.name}</h3>
                      <p className="text-xs text-bodyfont3 text-center">{review.role}</p>
                    </div>

                    {/* Review Card */}
                    <div className="flex-1 bg-[#DFEEFF]/30 p-5 shadow-lg md:p-6 rounded-tl-2xl rounded-bl-md rounded-tr-full rounded-br-full">
                      <div className="flex gap-1 mb-3">
                        {Array(review.rating)
                          .fill(0)
                          .map((_, i) => (
                            <span key={i} className="text-base text-yellow-400">
                              ★
                            </span>
                          ))}
                      </div>
                      <p className="text-sm leading-relaxed text-neutral-600">
                        {review.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Quote */}
            <div className="absolute right-4 bottom-20 text-6xl text-main50 opacity-40 md:right-8 md:bottom-32 md:text-8xl">
              "
            </div>
          </div>
        </section>
    </div>
  );
}
