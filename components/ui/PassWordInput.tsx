import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  label, hint, value, onChange, onBlur, placeholder, show, onToggle, error, success,
}: {
  label: string; hint?: string; value: string; placeholder: string; show: boolean; error: string; success?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-titlefont1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          style={!show ? ({ WebkitTextSecurity: "disc" } as React.CSSProperties) : undefined}
          className={`w-full rounded-lg border px-5 py-3 pr-11 text-sm bg-bg2 text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 transition-all ${
            error ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                  : success ? "border-green-400 focus:border-green-400 focus:ring-green-100"
                  : "border-line1 focus:border-main75 focus:ring-main25"
          }`}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-bodyfont4 transition-colors hover:text-bodyfont2">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        hint && <p className="text-xs text-bodyfont4">{hint}</p>
      )}
    </div>
  );
}