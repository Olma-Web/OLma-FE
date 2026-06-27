"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/topbar";
import { userAPI } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const userIdRaw = localStorage.getItem("userId");

    if (!token || !userIdRaw) {
      router.push("/login");
      return;
    }

    const userId = Number(userIdRaw);
    if (Number.isNaN(userId)) {
      router.push("/login");
      return;
    }

    userAPI
      .getProfile(userId)
      .then((data) => {
        if (data?.nickname) setNickname(data.nickname);
        if (data?.email) setEmail(data.email);
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({
        message: "모든 필드를 입력해주세요",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({
        message: "새 비밀번호가 일치하지 않습니다",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      // API 호출
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        setToast({
          message: "비밀번호가 성공적으로 변경되었습니다",
          type: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setToast({
          message: "비밀번호 변경에 실패했습니다",
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        message: "오류가 발생했습니다",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen w-full flex-col bg-white">
      <Topbar />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-8 md:py-16">
          {/* Header */}
          <div className="mb-10">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition"
            >
              <span>←</span>
              <span>뒤로가기</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">계정 설정</h1>
              <p className="text-sm text-neutral-600">
                비밀번호 변경 및 일반 설정을 관리해요
              </p>
            </div>
          </div>

          {isLoadingProfile ? (
            <div className="space-y-6">
              <div className="h-10 bg-neutral-200 rounded-lg animate-pulse" />
              <div className="h-10 bg-neutral-200 rounded-lg animate-pulse" />
              <div className="h-10 bg-neutral-200 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
          {/* Account Info Section */}
          <div className="mb-10">
            <h2 className="mb-6 text-lg font-semibold text-neutral-900">
              계정 정보
            </h2>

            {/* Nickname */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-main100"
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                className="w-full rounded-lg bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 cursor-not-allowed opacity-60"
              />
            </div>
          </div>

          {/* Password Change Section */}
          <div>
            <h2 className="mb-6 text-lg font-semibold text-neutral-900">
              비밀번호 변경
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                  className="w-full rounded-lg bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-main100"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력하세요"
                  className="w-full rounded-lg bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-main100"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  className="w-full rounded-lg bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-main100"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-main100 py-3 text-white font-semibold transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "처리 중..." : "비밀번호 변경"}
              </button>
            </form>
          </div>
            </>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg z-50 ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
