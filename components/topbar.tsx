import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "#", label: "시장 단가 탐색" },
  { href: "#", label: "스마트 견적 계산기" },
  { href: "#", label: "커뮤니티" },
  { href: "#", label: "커리어 관리" },
] as const;

export default function Topbar() {
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
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="transition-opacity hover:opacity-90"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative z-10 ml-auto flex items-center gap-3 md:gap-4">
        <Link
          href="#"
          className="text-sm text-white transition-opacity hover:opacity-90"
        >
          로그인
        </Link>
        <Link
          href="#"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-white/95"
        >
          회원가입
        </Link>
      </div>
    </header>
  );
}
