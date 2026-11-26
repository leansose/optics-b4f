"use client";

import { Factory, Package, SlidersHorizontal, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { type TranslationKey, useI18n } from "@/lib/i18n";
import { BrandLogo } from "./brand-logo";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

const pages = [
  { href: "/", label: "nav.production", Icon: Factory },
  { href: "/finance", label: "nav.finance", Icon: Wallet },
  { href: "/product", label: "nav.product", Icon: Package },
  { href: "/simulator", label: "nav.simulator", Icon: SlidersHorizontal },
] as const satisfies readonly {
  href: string;
  label: TranslationKey;
  Icon: typeof Factory;
}[];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  // Presenter shortcut: ← / → move between the four pages.
  useEffect(() => {
    const index = pages.findIndex((p) => p.href === pathname);
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (target?.closest("[data-filter-menu]")) return;
      if (target?.closest("[data-keyboard-control]")) return;
      if (e.key === "ArrowRight" && index < pages.length - 1) {
        e.preventDefault();
        router.push(pages[index + 1].href);
      }
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        router.push(pages[index - 1].href);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/"
            aria-label={t("nav.home")}
            className="flex shrink-0 items-center rounded-md"
          >
            <BrandLogo />
          </Link>
          <nav
            aria-label={t("nav.main")}
            className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <ul className="flex w-max items-center gap-1">
              {pages.map(({ href, label, Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-9 items-center gap-2 rounded-[var(--control-radius)] px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors sm:min-h-8 ${
                        active
                          ? "text-brand-ink shadow-[inset_0_-2px_0_var(--brand)]"
                          : "text-muted hover:bg-panel hover:text-ink"
                      }`}
                    >
                      <Icon size={15} aria-hidden="true" />
                      {t(label)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
