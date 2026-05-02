"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isActive = id.length > 0 && password.length > 0;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isActive) return;
    // TODO: API 연동 후 실제 인증 처리
    setError("아이디 또는 비밀번호가 일치하지 않습니다.");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-sm font-sans">

        <div className="flex flex-col items-center gap-2">
          <Image
            src="/logo.svg"
            alt="OLma"
            width={80}
            height={28}
            priority
            className="h-14 w-auto"
          />
          <p className="text-sm text-gray-700">로그인하고 당신의 시장가치를 확인해보세요!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg px-10 py-10 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">아이디</label>
              <input
                type="text"
                value={id}
                onChange={(e) => { setId(e.target.value); setError(""); }}
                placeholder="아이디를 입력하세요"
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm bg-gray-50 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={!isActive}
              className={`mt-2 w-full py-3 rounded-lg text-white font-semibold text-sm transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              로그인
            </button>
          </form>

          <p className="text-center text-sm text-gray-700 mt-5">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="text-blue-500 font-medium hover:underline transition-opacity hover:opacity-90"
            >
              회원가입
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
