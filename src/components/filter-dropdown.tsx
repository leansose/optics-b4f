"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/lib/i18n";

export type DropdownOption<T> = {
  label: string;
  value: T;
  hint?: string;
};

type Props<T> = {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  align?: "left" | "right";
};

/** Compact, keyboard-accessible select used by the shared filters and tables. */
export function FilterDropdown<T extends string | number | null>({
  label,
  value,
  options,
  onChange,
  className = "",
  align = "left",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    list.current
      ?.querySelector<HTMLButtonElement>('[aria-selected="true"]')
      ?.focus();

    function onPointerDown(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function onButtonKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    // Left/Right navigate between pages; keep them inside the menu.
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.stopPropagation();
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(list.current?.querySelectorAll("button") ?? [])];
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "ArrowDown"
        ? Math.min(current + 1, items.length - 1)
        : Math.max(current - 1, 0);
    items[next]?.focus();
  }

  return (
    <div ref={root} data-filter-menu className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${label.replace(/\s+/g, "-").toLowerCase()}-options`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-[var(--control-radius)] border bg-paper px-2.5 py-1.5 text-left text-[13px] transition-colors hover:border-brand active:bg-brand-soft/60 sm:min-h-8 ${
          open ? "border-brand bg-brand-soft" : "border-line"
        }`}
      >
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 text-xs text-muted">{label}</span>
          <span className="truncate font-medium text-ink">
            {selected?.label ?? t("common.all")}
          </span>
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          ref={list}
          id={`${label.replace(/\s+/g, "-").toLowerCase()}-options`}
          role="listbox"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className={`absolute top-full z-30 mt-1 max-h-72 min-w-full overflow-auto rounded-[var(--card-radius)] border border-line bg-surface p-1 shadow-[var(--pop-shadow)] focus-within:ring-2 focus-within:ring-brand-ink/25 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.label}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  button.current?.focus();
                }}
                className={`flex min-h-9 w-full items-center justify-between gap-4 rounded-[var(--control-radius)] px-2.5 py-1.5 text-left text-[13px] whitespace-nowrap sm:min-h-8 ${
                  active
                    ? "bg-brand-soft font-medium text-brand-ink"
                    : "text-ink hover:bg-paper"
                }`}
              >
                <span>
                  {option.label}
                  {option.hint ? (
                    <span className="ml-2 text-xs text-muted">
                      {option.hint}
                    </span>
                  ) : null}
                </span>
                {active ? <Check size={14} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
