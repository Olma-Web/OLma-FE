"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function WriteModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-10">
      <div className="absolute inset-0" onClick={() => router.back()} />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white px-6 py-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900">글쓰기</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
