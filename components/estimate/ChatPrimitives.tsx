"use client";

import Image from "next/image";

export function AiAvatar() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-main25 shadow-sm">
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none">
        <path
          d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
          className="fill-main50 stroke-white"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path d="M20 2v4" className="stroke-white" strokeWidth={1.5} strokeLinecap="round" />
        <path d="M22 4h-4" className="stroke-white" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx="4" cy="20" r="2" className="fill-white" />
      </svg>
    </div>
  );
}

export function UserAvatar() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sub50">
      <Image src="/user.svg" alt="user" width={28} height={28} />
    </div>
  );
}

export function QuestionBubble({ children, fullWidth }: { children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div
      className={`animate-chat-in ${fullWidth ? "w-full max-w-[480px]" : "w-fit max-w-md"} whitespace-pre-line text-left rounded-2xl rounded-tl-sm border border-line2 bg-white px-5 py-3 text-sm text-titlefont1 shadow-sm`}
    >
      {children}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex items-start gap-3">
      <AiAvatar />
      <div className="animate-chat-in flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-line2 bg-white px-4 py-3.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-bodyfont4"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function EditIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 20 16" fill="none">
      <path
        d="M14.1156 4.54126C14.4681 4.18888 14.6662 3.71091 14.6662 3.2125C14.6663 2.71409 14.4683 2.23607 14.116 1.8836C13.7636 1.53112 13.2856 1.33307 12.7872 1.33301C12.2888 1.33295 11.8108 1.53088 11.4583 1.88326L2.56096 10.7826C2.40618 10.9369 2.29171 11.127 2.22763 11.3359L1.34696 14.2373C1.32973 14.2949 1.32843 14.3562 1.3432 14.4145C1.35796 14.4728 1.38824 14.5261 1.43083 14.5686C1.47341 14.6111 1.52671 14.6413 1.58507 14.656C1.64343 14.6707 1.70467 14.6693 1.7623 14.6519L4.6643 13.7719C4.87308 13.7084 5.06308 13.5947 5.21763 13.4406L14.1156 4.54126Z"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 3.3335L12.6667 6.00016"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AnswerPill({
  text,
  onEdit,
  editDisabled,
}: {
  text: string;
  onEdit: () => void;
  editDisabled: boolean;
}) {
  return (
    <div className="group animate-chat-in flex items-start justify-end gap-2">
      <button
        onClick={onEdit}
        disabled={editDisabled}
        className="mt-2 shrink-0 rounded-full border border-transparent p-1 text-bodyfont4 opacity-0 transition hover:border-main100 hover:bg-gray-100 hover:text-main100 group-hover:opacity-100 disabled:cursor-default disabled:opacity-0 cursor-pointer"
        aria-label="답변 수정"
      >
        <EditIcon />
      </button>
      <div className="max-w-sm rounded-2xl rounded-tr-sm bg-main100 px-4 py-2.5 text-sm font-medium text-white shadow-sm">
        {text}
      </div>
      <UserAvatar />
    </div>
  );
}
