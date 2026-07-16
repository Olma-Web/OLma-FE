import { Check } from "lucide-react";

// 백엔드가 허용하는 특수문자 범위와 동일하게 맞춤: !@#$%^&*(),.?":{}|<>
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

export const PASSWORD_RULES: { key: string; label: string; test: (v: string) => boolean }[] = [
  { key: "length", label: "8자 이상", test: (v) => v.length >= 8 },
  { key: "letter", label: "영문 포함", test: (v) => /[a-zA-Z]/.test(v) },
  { key: "number", label: "숫자 포함", test: (v) => /[0-9]/.test(v) },
  { key: "special", label: "특수문자 포함", test: (v) => SPECIAL_CHAR_REGEX.test(v) },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <div className="flex flex-nowrap items-center gap-x-1.5">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <span
            key={rule.key}
            className={`flex shrink-0 items-center gap-0.5 text-[11px] transition-colors ${
              passed ? "text-green-500" : "text-bodyfont4"
            }`}
          >
            <Check size={11} className={passed ? "text-green-500" : "text-bodyfont4"} />
            {rule.label}
          </span>
        );
      })}
    </div>
  );
}
