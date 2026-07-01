"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  nickname: string;
  onLogout: () => void;
}

export default function UserDropdown({ nickname, onLogout }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown((v) => !v)}
        className="flex items-center gap-2"
      >
        <div
          className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400"
          aria-label="사용자 아바타"
          role="img"
        />
        <span className="text-sm text-white">{nickname}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-10 w-44 rounded-xl bg-white shadow-lg py-2 z-50">
          <Link
            href="/user"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-titlefont2 hover:bg-bg2"
            onClick={() => setShowDropdown(false)}
          >
            내가 쓴 글 / 댓글
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-titlefont2 hover:bg-bg2"
            onClick={() => setShowDropdown(false)}
          >
            계정 설정
          </Link>
          <hr className="my-1 border-line2" />
          <button
            onClick={() => { setShowDropdown(false); onLogout(); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-bg2"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}