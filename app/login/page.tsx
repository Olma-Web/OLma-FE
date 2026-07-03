"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { PasswordInput } from "@/components/ui/PassWordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isActive = email.length > 0 && password.length > 0;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isActive) return;

    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", String(data.id));
      localStorage.removeItem("careerSavedIds");
      window.location.href = "/";
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "서버에 연결할 수 없어요");
    }
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

              {/* 이메일 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-titlefont1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  placeholder="이메일을 입력하세요"
                  className={`rounded-lg border px-5 py-3 text-sm bg-bg2 text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 transition-all ${
                    emailError
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-line1 focus:border-main75 focus:ring-main25"
                  }`}
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              {/* 비밀번호 */}
              <PasswordInput
                label="비밀번호"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                placeholder="비밀번호를 입력하세요"
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                error={passwordError}
              />

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
              <Link href="/signup"
                className="font-medium text-main100 hover:underline transition-opacity hover:opacity-90">
                회원가입
              </Link>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}