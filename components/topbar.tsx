"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { userAPI } from "@/lib/api";
import UserDropdown from "@/components/ui/UserDropdown";

const NAV_ITEMS = [
  { href: "/dashboard", label: "시장 단가 탐색" },
  { href: "/estimate", label: "스마트 견적 계산기" },
  { href: "/community", label: "커뮤니티" },
  { href: "/career", label: "커리어 관리" },
] as const;

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("User");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const userIdRaw = localStorage.getItem("userId");

    if (!token || !userIdRaw) return;

    const userId = Number(userIdRaw);
    if (Number.isNaN(userId)) return;

    setIsLoggedIn(true);

    userAPI
      .getProfile(userId)
      .then((data) => {
        if (data?.nickname) setNickname(data.nickname);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <header className="relative flex min-h-14 items-center bg-charcoal px-4 py-3 md:min-h-16 md:px-8">
      <Link href="/" className="relative z-10 shrink-0">
        <Image
          src="/logo.svg"
          alt="Olma"
          width={70}
          height={20}
          priority
          className="h-6 w-auto md:h-7"
        />
      </Link>

      <nav
        className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
        aria-label="주요 메뉴"
      >
        <ul className="flex items-center gap-5 whitespace-nowrap text-sm text-white lg:gap-8 lg:text-[15px]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={
                    isActive
                      ? "rounded-lg bg-main100 px-3 py-1.5 text-white"
                      : "transition-opacity hover:opacity-90"
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative z-10 ml-auto flex items-center gap-2">
        {isLoggedIn ? (
          <UserDropdown nickname={nickname} onLogout={handleLogout} />
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm text-white transition-opacity hover:opacity-80"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-charcoal transition-opacity hover:opacity-90"
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  );
}