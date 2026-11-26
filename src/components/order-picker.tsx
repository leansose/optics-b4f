"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { fmtInt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { type OrderRow, orderLabel, orderMatches } from "@/lib/orders";

const MAX_OPTIONS = 60;

type Props = {
  orders: OrderRow[];
  value: string;
  onChange: (code: string) => void;
};

/** Searchable order chooser; only delivered orders matching global filters are passed in. */
export function OrderPicker({ orders, value, onChange }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const selected = orders.find((row) => row[0] === value) ?? orders[0];
  const matching = useMemo(
    () => orders.filter((row) => orderMatches(row, query)),
    [orders, query],
  );
  const visible = matching.slice(0, MAX_OPTIONS);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    function onPointerDown(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(code: string) {
    onChange(code);
    setQuery("");
    setOpen(false);
    trigger.current?.focus();
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      list.current
        ?.querySelector<HTMLButtonElement>('button[role="option"]')
        ?.focus();
    }
    if (e.key === "Enter" && visible.length > 0) {
      e.preventDefault();
      choose(visible[0][0]);
    }
  }

  function onListKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    // Left/Right move between pages; keep them inside the menu.
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.stopPropagation();
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [
      ...(list.current?.querySelectorAll<HTMLButtonElement>(
        'button[role="option"]',
      ) ?? []),
    ];
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "ArrowDown"
        ? Math.min(current + 1, items.length - 1)
        : Math.max(current - 1, 0);
    items[next]?.focus();
  }

  return (
    <div ref={root} data-keyboard-control className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-[var(--control-radius)] border bg-paper px-2.5 py-2 text-left text-xs transition-colors hover:border-brand active:scale-[0.99] ${
          open ? "border-brand bg-brand-soft" : "border-line"
        }`}
      >
        <span className="truncate font-medium text-ink">
          {selected
            ? orderLabel(selected, t("common.lenses"), t("common.unknown"))
            : t("order.none")}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute top-full right-0 left-0 z-40 mt-1 overflow-hidden rounded-[var(--card-radius)] border border-line bg-surface shadow-[var(--pop-shadow)] focus-within:ring-2 focus-within:ring-brand-ink/25">
          <div className="flex items-center gap-2 border-b border-line px-2.5 py-2 focus-within:bg-panel">
            <Search
              size={14}
              aria-hidden="true"
              className="shrink-0 text-muted"
            />
            <input
              ref={input}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              aria-label={t("order.search")}
              placeholder={t("order.placeholder")}
              className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
            />
          </div>
          <div
            ref={list}
            id={listId}
            role="listbox"
            aria-label={t("order.list")}
            aria-live="polite"
            onKeyDown={onListKeyDown}
            className="max-h-64 overflow-auto p-1"
          >
            {visible.map((row) => {
              const active = row[0] === selected?.[0];
              return (
                <button
                  key={row[0]}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(row[0])}
                  className={`flex w-full items-center justify-between gap-2 rounded-[var(--control-radius)] px-2 py-2 text-left text-xs whitespace-nowrap ${
                    active
                      ? "bg-brand-soft font-medium text-brand-ink"
                      : "text-ink hover:bg-paper"
                  }`}
                >
                  <span className="truncate">
                    {orderLabel(row, t("common.lenses"), t("common.unknown"))}
                  </span>
                  {active ? <Check size={13} aria-hidden="true" /> : null}
                </button>
              );
            })}
            {visible.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted">{t("order.empty")}</p>
            ) : null}
            {matching.length > visible.length ? (
              <p className="border-t border-line px-2 py-1.5 text-xs text-muted">
                {t("order.showing", {
                  shown: fmtInt(visible.length),
                  total: fmtInt(matching.length),
                })}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
