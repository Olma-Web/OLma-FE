import Link from "next/link";
import Topbar from "@/components/topbar";

const AVATAR_LABELS = ["A", "B", "C", "D", "E"] as const;

export default function Home() {
  return (
    <div className="relative isolate flex min-h-screen w-full flex-1 flex-col font-sans">
      <div className="bg-home-background-layer pointer-events-none" aria-hidden />
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

          <Link
            href="#"
            className="mb-11 inline-flex items-center gap-2 rounded-xl bg-main100 px-15 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_32px_-8px_rgba(69,78,255,0.45)] transition hover:brightness-105"
          >
            내 단가 분석하기
            <span aria-hidden className="translate-y-px">
              →
            </span>
          </Link>

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
    </div>
  );
}
