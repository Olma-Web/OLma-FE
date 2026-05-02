"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

// TODO: API 연동 후 실제 인증으로 교체
const MOCK_USER = { id: "test", password: "1234" };

export default function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [idError, setIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isActive = id.length > 0 && password.length > 0;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isActive) return;

    if (id !== MOCK_USER.id) {
      setIdError("아이디를 다시 입력해주세요.");
      setPasswordError("");
      return;
    }
    if (password !== MOCK_USER.password) {
      setIdError("");
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setIdError("");
    setPasswordError("");
    // TODO: 로그인 성공 후 라우팅 처리
  };

  return (
    <div className="relative isolate flex min-h-screen w-full flex-1 flex-col font-sans">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-login.png')" }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <main className="flex w-full max-w-sm flex-col items-center gap-5">

          <div className="flex flex-col items-center gap-2">
            <Image
              src="/logo.svg"
              alt="OLma"
              width={80}
              height={28}
              priority
              className="h-14 w-auto"
            />
            <p className="text-sm text-bodyfont2">로그인하고 당신의 시장가치를 확인해보세요!</p>
          </div>

          <div className="w-full rounded-2xl bg-white px-10 py-10 shadow-lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-titlefont1">아이디</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => { setId(e.target.value); setIdError(""); }}
                  placeholder="아이디를 입력하세요"
                  className={`rounded-lg border px-5 py-3 text-sm bg-bg2 text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 transition-all ${
                    idError
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-line1 focus:border-main75 focus:ring-main25"
                  }`}
                />
                {idError && <p className="text-xs text-red-500">{idError}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-titlefont1">비밀번호</label>
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                    placeholder="비밀번호를 입력하세요"
                    style={!showPassword ? { WebkitTextSecurity: "disc" } as React.CSSProperties : undefined}
                    className={`w-full rounded-lg border px-5 py-3 pr-11 text-sm bg-bg2 text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 transition-all ${
                      passwordError
                        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                        : "border-line1 focus:border-main75 focus:ring-main25"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bodyfont4 transition-colors hover:text-bodyfont2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              </div>

              <button
                type="submit"
                disabled={!isActive}
                className={`mt-2 w-full rounded-lg py-3 text-sm font-semibold text-white transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-main100 to-sub175 hover:brightness-105 cursor-pointer"
                    : "bg-line1 text-bodyfont4 cursor-not-allowed"
                }`}
              >
                로그인
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-bodyfont2">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="font-medium text-main100 hover:underline transition-opacity hover:opacity-90"
              >
                회원가입
              </Link>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
