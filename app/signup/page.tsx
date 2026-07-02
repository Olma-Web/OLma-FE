"use client";

import { useState } from "react";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { PasswordInput } from "@/components/ui/PassWordInput";

// --- validation ---
const isValidNickname = (v: string) => /^[a-zA-Z0-9가-힣\-_.]{2,10}$/.test(v);

const validateEmail = (v: string) =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "올바른 이메일 형식이 아닙니다.";

const validatePassword = (v: string) => {
  if (!v) return "";
  if (v.length < 8) return "비밀번호는 8자리 이상이어야 합니다.";
  if (!/[a-zA-Z]/.test(v)) return "영문자를 1자 이상 포함해야 합니다.";
  if (!/[0-9]/.test(v)) return "숫자를 1자 이상 포함해야 합니다.";
  if (!/[^a-zA-Z0-9]/.test(v)) return "특수문자를 1자 이상 포함해야 합니다.";
  return "";
};

const validatePasswordConfirm = (v: string, password: string) =>
  !v || v === password ? "" : "비밀번호가 일치하지 않습니다.";

const validateNickname = (v: string) =>
  isValidNickname(v) ? "" : "2~10자, 한글·영문·숫자·-_.만 사용 가능합니다.";

// --- input className ---
const inputClass = (error: string) =>
  `rounded-lg border px-5 py-3 text-sm bg-bg2 text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 transition-all ${
    error ? "border-red-400 focus:border-red-400 focus:ring-red-100"
           : "border-line1 focus:border-main75 focus:ring-main25"
  }`;

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "", nickname: "" });
  const [errors, setErrors] = useState({ email: "", password: "", passwordConfirm: "", nickname: "" });
  const [show, setShow] = useState({ password: false, passwordConfirm: false });
  const [agreed, setAgreed] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: "" }));
  };

  const isActive = Object.values(form).every((v) => v.length > 0) && agreed;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isActive) return;

    const newErrors = {
      email:           validateEmail(form.email),
      password:        validatePassword(form.password),
      passwordConfirm: validatePasswordConfirm(form.passwordConfirm, form.password),
      nickname:        validateNickname(form.nickname),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      const data = await authAPI.signup(form.email, form.password, form.nickname);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", String(data.id));
      localStorage.setItem("nickname", form.nickname);
      window.location.href = "/onboarding";
    } catch (err) {
      alert(err instanceof Error ? err.message : "서버에 연결할 수 없어요");
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

          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl font-bold text-main100">Sign Up</h1>
            <p className="text-sm text-bodyfont2">3초만에 당신의 시장 가치를 확인하세요</p>
          </div>

          <div className="w-full rounded-2xl bg-white px-10 py-8 shadow-lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* 이메일 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-titlefont1">이메일</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  onBlur={() => setErrors((err) => ({ ...err, email: validateEmail(form.email) }))}
                  placeholder="이메일을 입력하세요"
                  className={inputClass(errors.email)}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* 비밀번호 */}
              <PasswordInput
                label="비밀번호"
                hint="영문, 숫자, 특수문자 조합 8자리 이상"
                value={form.password}
                onChange={set("password")}
                onBlur={() => setErrors((err) => ({ ...err, password: validatePassword(form.password) }))}
                placeholder="비밀번호를 입력하세요"
                show={show.password}
                onToggle={() => setShow((s) => ({ ...s, password: !s.password }))}
                error={errors.password}
              />

              {/* 비밀번호 확인 */}
              <PasswordInput
                label="비밀번호 확인"
                value={form.passwordConfirm}
                onChange={set("passwordConfirm")}
                onBlur={() => setErrors((err) => ({ ...err, passwordConfirm: validatePasswordConfirm(form.passwordConfirm, form.password) }))}
                placeholder="비밀번호를 입력하세요"
                show={show.passwordConfirm}
                onToggle={() => setShow((s) => ({ ...s, passwordConfirm: !s.passwordConfirm }))}
                error={errors.passwordConfirm}
              />

              {/* 닉네임 */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-titlefont1">닉네임</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={set("nickname")}
                  placeholder="사용할 닉네임을 입력하세요"
                  className={inputClass(errors.nickname)}
                />
                {errors.nickname ? (
                  <p className="text-xs text-red-500">{errors.nickname}</p>
                ) : (
                  <p className="text-xs text-bodyfont4">한글, 영문, 숫자 조합 2자리 이상</p>
                )}
              </div>

              {/* 약관 동의 */}
              <label className="flex cursor-pointer items-start gap-2 text-sm text-bodyfont2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-main100"
                />
                <span>
                  <span className="font-medium text-main100">[필수]</span> 개인정보 수집 및 이용에 동의합니다.
                  <br />
                  <span className="text-xs text-bodyfont4">(단가 데이터는 익명 통계 목적으로만 활용됩니다)</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={!isActive}
                className={`mt-1 w-full rounded-lg py-3 text-sm font-semibold text-white transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-main100 to-sub175 hover:brightness-105 cursor-pointer"
                    : "bg-line1 text-bodyfont4 cursor-not-allowed"
                }`}
              >
                회원가입
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-bodyfont2">
              이미 계정이 있으신가요?{" "}
              <Link href="/login"
                className="font-medium text-main100 hover:underline transition-opacity hover:opacity-90">
                로그인
              </Link>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}