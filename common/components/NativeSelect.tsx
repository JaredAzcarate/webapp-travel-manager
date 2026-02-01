"use client";

export interface NativeSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface NativeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: NativeSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  id?: string;
}

const baseSelectClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

export function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  allowClear = false,
  className = "",
  id,
}: NativeSelectProps) {
  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`${baseSelectClass} ${className}`}
    >
      {(placeholder || allowClear) && (
        <option value="">{placeholder ?? "—"}</option>
      )}
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}
