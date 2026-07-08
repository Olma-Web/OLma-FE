"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/topbar";
import { userAPI } from "@/lib/api";
import Image from "next/image";

const PASSWORD_REQUIREMENTS = {
  minLength: (pwd: string) => pwd.length >= 8,
  hasLetter: (pwd: string) => /[a-zA-Z]/.test(pwd),
  hasNumber: (pwd: string) => /\d/.test(pwd),
  hasSpecial: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
};

export default function SettingsPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editingNickname, setEditingNickname] = useState("");
  const [showCurrentPasswordText, setShowCurrentPasswordText] = useState(false);
  const [showNewPasswordText, setShowNewPasswordText] = useState(false);
  const [showConfirmPasswordText, setShowConfirmPasswordText] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState("");
  const [showConfirmError, setShowConfirmError] = useState("");
  const [showCurrentPasswordError, setShowCurrentPasswordError] = useState("");
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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isPasswordValid = (pwd: string) => {
    return (
      PASSWORD_REQUIREMENTS.minLength(pwd) &&
      PASSWORD_REQUIREMENTS.hasLetter(pwd) &&
      PASSWORD_REQUIREMENTS.hasNumber(pwd) &&
      PASSWORD_REQUIREMENTS.hasSpecial(pwd)
    );
  };

  const handleNicknameChange = async () => {
    if (!editingNickname.trim()) {
      showToast("닉네임을 입력해주세요", "error");
      return;
    }

    try {
      // API 호출 (나중에 구현)
      setNickname(editingNickname);
      showToast("닉네임이 변경되었습니다", "success");
      setIsEditingNickname(false);
    } catch (error) {
      showToast("닉네임 변경에 실패했습니다", "error");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPasswordError("");
    setShowConfirmError("");
    setShowCurrentPasswordError("");

    if (!currentPassword) {
      setShowCurrentPasswordError("현재 비밀번호를 입력해주세요");
      return;
    }

    if (!newPassword) {
      setShowPasswordError("새 비밀번호를 입력해주세요");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setShowPasswordError("비밀번호가 조건을 충족하지 않습니다");
      return;
    }

    if (!confirmPassword) {
      setShowConfirmError("비밀번호 확인을 입력해주세요");
      return;
    }

    if (newPassword !== confirmPassword) {
      setShowConfirmError("비밀번호가 일치하지 않습니다");
      return;
    }

    setIsLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword,
        newPassword,
      });

      showToast("비밀번호가 성공적으로 변경되었습니다", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error instanceof Error && error.message.includes("현재 비밀번호")) {
        setShowCurrentPasswordError("현재 비밀번호가 일치하지 않습니다");
      } else {
        showToast(
          error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다",
          "error"
        );
      }
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

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 mb-6">
              {!isEditingNickname ? (
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Image src="/user.svg" alt="user" width={28} height={28} />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">닉네임</p>
                        <p className="text-base font-medium text-neutral-900">{nickname}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Image src="/email.svg" alt="email" width={28} height={28} />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">이메일</p>
                        <p className="text-base text-neutral-900">{email}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingNickname(nickname);
                      setIsEditingNickname(true);
                    }}
                    className="text-neutral-400 hover:text-neutral-600 transition p-1 flex-shrink-0"
                  >
                    <Image src="/edit.svg" alt="edit" width={24} height={24} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      닉네임
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingNickname}
                        onChange={(e) => setEditingNickname(e.target.value)}
                        placeholder="새로운 닉네임을 입력하세요"
                        className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-main100"
                        autoFocus
                      />
                      <button
                        onClick={handleNicknameChange}
                        className="rounded-lg bg-main100 text-white px-4 py-2 hover:brightness-105 transition flex items-center justify-center flex-shrink-0"
                      >
                        <Image src="/check.svg" alt="check" width={20} height={20} />
                      </button>
                      <button
                        onClick={() => setIsEditingNickname(false)}
                        className="rounded-lg bg-neutral-200 text-neutral-600 px-4 py-1 hover:bg-neutral-300 transition flex items-center justify-center flex-shrink-0"
                      >
                        <Image src="/exit.svg" alt="exit" width={20} height={20} />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">한글, 영문, 숫자 조합 2자리 이상</p>
                  </div>
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Image src="/email.svg" alt="email" width={28} height={28} />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">이메일</p>
                        <p className="text-sm font-medium text-neutral-900">{email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Password Change Section */}
          <div className="mb-10">
            <h2 className="mb-6 text-lg font-semibold text-neutral-900">
              비밀번호 변경
            </h2>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    현재 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPasswordText ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (e.target.value) setShowCurrentPasswordError("");
                      }}
                      placeholder="현재 비밀번호를 입력하세요"
                      className={`w-full rounded-lg px-4 py-3 pr-12 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 ${
                        showCurrentPasswordError
                          ? "bg-red-50 border border-red-300 focus:ring-red-300"
                          : "bg-neutral-100 focus:ring-main100"
                      }`}
                    />
                    {currentPassword && !showCurrentPasswordError && (
                      <button
                        type="button"
                        onClick={() => setShowCurrentPasswordText(!showCurrentPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition"
                      >
                        <Image src="/eye.svg" alt="toggle password visibility" width={20} height={20} />
                      </button>
                    )}
                  </div>
                  {showCurrentPasswordError && (
                    <p className="mt-1 text-xs text-red-600">{showCurrentPasswordError}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    새 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPasswordText ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (e.target.value) setShowPasswordError("");
                      }}
                      placeholder="새 비밀번호를 입력하세요"
                      className={`w-full rounded-lg px-4 py-3 pr-12 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 ${
                        newPassword && isPasswordValid(newPassword)
                          ? "bg-green-50 border border-green-300 focus:ring-green-300"
                          : newPassword && showPasswordError
                          ? "bg-red-50 border border-red-300 focus:ring-red-300"
                          : newPassword
                          ? "bg-yellow-50 border border-yellow-300 focus:ring-yellow-300"
                          : "bg-neutral-100 focus:ring-main100"
                      }`}
                    />
                    {newPassword && (
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordText(!showNewPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition"
                      >
                        <Image src="/eye.svg" alt="toggle password visibility" width={20} height={20} />
                      </button>
                    )}
                  </div>
                  {newPassword && (
                    <div className="mt-2 text-xs space-y-1">
                      <div className={PASSWORD_REQUIREMENTS.minLength(newPassword) ? "text-green-600" : "text-neutral-500"}>
                        ✓ 8자 이상
                      </div>
                      <div className={PASSWORD_REQUIREMENTS.hasLetter(newPassword) ? "text-green-600" : "text-neutral-500"}>
                        ✓ 영문 포함
                      </div>
                      <div className={PASSWORD_REQUIREMENTS.hasNumber(newPassword) ? "text-green-600" : "text-neutral-500"}>
                        ✓ 숫자 포함
                      </div>
                      <div className={PASSWORD_REQUIREMENTS.hasSpecial(newPassword) ? "text-green-600" : "text-neutral-500"}>
                        ✓ 특수문자 포함
                      </div>
                    </div>
                  )}
                  {showPasswordError && !newPassword && (
                    <p className="mt-1 text-xs text-red-600">{showPasswordError}</p>
                  )}
                  {showPasswordError && newPassword && (
                    <p className="mt-1 text-xs text-red-600">{showPasswordError}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    새 비밀번호 확인
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPasswordText ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (e.target.value) setShowConfirmError("");
                      }}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      className={`w-full rounded-lg px-4 py-3 pr-12 text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 ${
                        confirmPassword && confirmPassword === newPassword
                          ? "bg-green-50 border border-green-300 focus:ring-green-300"
                          : confirmPassword && showConfirmError
                          ? "bg-red-50 border border-red-300 focus:ring-red-300"
                          : confirmPassword
                          ? "bg-yellow-50 border border-yellow-300 focus:ring-yellow-300"
                          : "bg-neutral-100 focus:ring-main100"
                      }`}
                    />
                    {confirmPassword && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmPasswordText(!showConfirmPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition"
                      >
                        <Image src="/eye.svg" alt="toggle password visibility" width={20} height={20} />
                      </button>
                    )}
                  </div>
                  {showConfirmError && (
                    <p className="mt-1 text-xs text-red-600">{showConfirmError}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}
                  className="w-full rounded-2xl bg-main100 py-3 text-white font-semibold transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "처리 중..." : "비밀번호 변경"}
                </button>
              </form>
            </div>
          </div>

          {/* Service Withdrawal Section */}
          <div className="rounded-2xl bg-red-50 border border-red-100 p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-red-500 text-lg">⚠</div>
              <div>
                <h3 className="font-semibold text-red-900 mb-2">서비스 탈퇴</h3>
                <p className="text-sm text-red-700 mb-4">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 단기 기한, 경쟁사, 커뮤니티 활동 내역이 모두 사라집니다.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm font-semibold text-red-600 border border-red-600 rounded-lg px-4 py-2 hover:bg-red-50 transition"
                >
                  서비스 탈퇴하기
                </button>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>

      {/* Withdrawal Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-neutral-900 mb-2">정말 탈퇴하시겠어요?</h2>
            <p className="text-sm text-neutral-600 mb-6">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  showToast("계정이 삭제되었습니다", "success");
                  setShowDeleteConfirm(false);
                  setTimeout(() => router.push("/"), 1500);
                }}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

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
