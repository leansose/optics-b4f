"use client";

export type DropdownOption<T> = { label: string; value: T };
export function FilterDropdown<T extends string | number | null>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <label
      className={`flex min-w-0 flex-col gap-1.5 text-sm text-muted ${className}`}
    >
      {label}
      <select
        value={options.findIndex((o) => o.value === value)}
        onChange={(e) => onChange(options[e.currentTarget.selectedIndex].value)}
        className="min-h-11 min-w-0 rounded-lg border border-line bg-paper px-2.5 font-medium text-ink"
      >
        {options.map((o, i) => (
          <option key={String(o.value)} value={i}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
