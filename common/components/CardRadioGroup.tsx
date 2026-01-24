"use client";

export interface CardRadioOption {
  value: string;
  tag: string;
  primary: string;
  secondary?: string;
}

interface CardRadioGroupProps {
  options: CardRadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CardRadioGroup({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
}: CardRadioGroupProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}
      role="radiogroup"
      aria-disabled={disabled}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => !disabled && onChange?.(opt.value)}
            className={`
              relative flex flex-col items-start text-left p-4 rounded-2xl
              bg-white transition-all duration-200
              ${selected ? "ring-2 ring-primary" : "border border-gray-200 hover:border-gray-300"}
              ${disabled ? "cursor-not-allowed" : ""}
            `}
          >
            <div className="flex w-full justify-between items-start gap-2 mb-3">
              <span
                className={`
                  px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${selected ? "bg-primary text-white" : "bg-gray-50 text-gray-800"}
                `}
              >
                {opt.tag}
              </span>
              <span
                className={`
                  shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                  ${selected ? "bg-primary" : "border-2 border-gray-300"}
                `}
              >
                {selected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
            </div>
            <span className="text-base font-semibold text-gray-900">
              {opt.primary}
            </span>
            {opt.secondary && (
              <span className="text-sm text-gray-500 mt-0.5">
                {opt.secondary}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
