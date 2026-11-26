"use client";

import { ChevronDown, TriangleExclamationPoint } from "lucide-react";
import { useMemo } from "react";
import { Card } from "@/components/page-shell";
import { type Agg, aggregate, SHOPS } from "@/lib/cube";
import { feedbackStats } from "@/lib/feedback";
import { useFilters } from "@/lib/filters";
import { useFormat } from "@/lib/format";
import { type TranslationKey, useI18n } from "@/lib/i18n";
import { type IncidentCause, incidentCauses } from "@/lib/incidents";

type Basis = "order" | "lens";

type Problem = {
  id: string;
  titleKey: TranslationKey;
  detailKey: TranslationKey;
  fixKey: TranslationKey;
  vars: Record<string, string | number>;
};

const TYPE_KEYS: Record<string, TranslationKey> = {
  ajuste: "dm.typeAdjustment",
  retrabalho: "dm.typeRework",
  devolucao: "dm.typeReturn",
  substituicao: "dm.typeReplacement",
};

const MOTIVE_KEYS: Record<string, TranslationKey> = {
  unspecified: "dm.motiveUnspecified",
  wrong_graduation: "dm.motiveWrongGraduation",
  scratched_lens: "dm.motiveScratchedLens",
  mounting: "dm.motiveMounting",
  discomfort: "dm.motiveDiscomfort",
  damage: "dm.motiveDamage",
  uneven_tint: "dm.motiveUnevenTint",
};

const MOTIVE_FIX: Record<string, TranslationKey> = {
  wrong_graduation: "dm.fixWrongGraduation",
  scratched_lens: "dm.fixScratchedLens",
  mounting: "dm.fixMounting",
  discomfort: "dm.fixDiscomfort",
  damage: "dm.fixDamage",
  uneven_tint: "dm.fixUnevenTint",
};

const TYPE_FIX: Record<string, TranslationKey> = {
  ajuste: "dm.fixAdjustment",
  retrabalho: "dm.fixRework",
  devolucao: "dm.fixReturn",
  substituicao: "dm.fixReplacement",
};

/** Decision-support panel driven by the shared filters above the page. */
export function DecisionMaker({ basis }: { basis: Basis }) {
  const { fmtInt, fmtPct, fmtUnits } = useFormat();
  const { filters } = useFilters();
  const { t } = useI18n();
  const shop = filters.shop;

  const a = useMemo<Agg>(() => aggregate(filters), [filters]);
  const modelIds = useMemo<number[] | null>(
    () => (filters.model === null ? null : [filters.model]),
    [filters.model],
  );

  const cityCause = useMemo(
    () => incidentCauses(shop, filters.year, null, 1)[0] ?? null,
    [shop, filters.year],
  );
  const modelCause = useMemo(
    () =>
      modelIds
        ? (incidentCauses(shop, filters.year, modelIds, 1)[0] ?? null)
        : null,
    [shop, filters.year, modelIds],
  );

  const production = basis === "lens" ? a.pl : a.p;
  const incidentShare = a.v ? a.oc / a.v : 0;
  const marginBefore = a.v ? (a.v - production - a.lg) / a.v : 0;
  const marginAfter = a.v ? (a.v - production - a.lg - a.oc) / a.v : 0;
  const feedback = feedbackStats(shop, filters.year);

  const shopLabel =
    shop === null ? t("dm.allShops") : (SHOPS[shop]?.name ?? "");
  const modelsLabel =
    filters.model === null
      ? t("dm.modelAll")
      : `L${String(filters.model).padStart(3, "0")}`;

  // Only the "service is stable" branch gets the calm treatment.
  const stableService =
    Boolean(a.d) && incidentShare < 0.07 && marginBefore >= 0.25;

  const alert = !a.d
    ? t("dm.noData")
    : incidentShare >= 0.07
      ? t("dm.alertIncidents", {
          share: fmtPct(incidentShare),
          models: modelsLabel,
          shop: shopLabel,
          amount: fmtUnits(a.oc, 0),
          orders: fmtInt(a.d),
        })
      : marginBefore < 0.25
        ? t("dm.alertMargin", { models: modelsLabel, shop: shopLabel })
        : t("dm.alertService", { models: modelsLabel, shop: shopLabel });

  const rows = [
    {
      label: t("dm.indicatorIncidents"),
      value: a.v ? fmtPct(incidentShare) : "—",
      note: t("dm.incidentsNote", {
        amount: fmtUnits(a.oc, 0),
        orders: fmtInt(a.d),
      }),
      action: t("dm.actionIncidents", {
        models: modelsLabel,
        shop: shopLabel,
      }),
    },
    {
      label: t("dm.indicatorMargin"),
      value: a.v ? fmtPct(marginBefore) : "—",
      note: t("dm.marginNote", { margin: fmtPct(marginAfter) }),
      action: t("dm.actionMargin", {
        basis: t(basis === "lens" ? "common.perLens" : "common.perOrder"),
      }),
    },
    {
      label: t("dm.indicatorSatisfaction"),
      value: feedback.count ? `${fmtUnits(feedback.score, 2)} / 5` : "–",
      note: t("dm.satisfactionNote", {
        count: fmtInt(feedback.count),
        shop: shopLabel,
      }),
      action: t("dm.actionSatisfaction", { shop: shopLabel }),
    },
  ];

  const causeVars = (cause: IncidentCause, models: string) => ({
    shop: shopLabel,
    models,
    cause: `${t(TYPE_KEYS[cause.type] ?? "dm.typeRework")} · ${t(MOTIVE_KEYS[cause.motive] ?? "dm.motiveUnspecified")}`,
    count: fmtInt(cause.count),
    cost: fmtUnits(cause.cost, 0),
    share: fmtPct(cause.share),
  });
  const causeFix = (cause: IncidentCause) =>
    MOTIVE_FIX[cause.motive] ?? TYPE_FIX[cause.type] ?? "dm.fixUnspecified";

  const problems: Problem[] = [];
  if (cityCause) {
    problems.push({
      id: `city-${cityCause.type}-${cityCause.motive}`,
      titleKey: "dm.problemCity",
      detailKey: "dm.problemCauseDetail",
      fixKey: causeFix(cityCause),
      vars: causeVars(cityCause, t("dm.modelAll")),
    });
  }
  if (modelCause && modelIds) {
    problems.push({
      id: `model-${modelCause.type}-${modelCause.motive}`,
      titleKey: "dm.problemModel",
      detailKey: "dm.problemCauseDetail",
      fixKey: causeFix(modelCause),
      vars: causeVars(modelCause, modelsLabel),
    });
  }
  const lowNeg = basis === "lens" ? a.lowNegL : a.lowNegO;
  if (a.lowN && lowNeg) {
    problems.push({
      id: "low-price",
      titleKey: "dm.problemLowPrice",
      detailKey: "dm.problemLowPriceDetail",
      fixKey: "dm.fixLowPrice",
      vars: {
        models: modelsLabel,
        shop: shopLabel,
        neg: fmtInt(lowNeg),
        low: fmtInt(a.lowN),
        share: fmtPct(lowNeg / a.lowN),
      },
    });
  }
  if (shop !== null && feedback.count && feedback.score < 4.2) {
    problems.push({
      id: "satisfaction",
      titleKey: "dm.problemSatisfaction",
      detailKey: "dm.problemSatisfactionDetail",
      fixKey: "dm.fixSatisfaction",
      vars: {
        models: modelsLabel,
        shop: shopLabel,
        score: fmtUnits(feedback.score, 2),
        count: fmtInt(feedback.count),
      },
    });
  }
  if (a.d && !problems.length) {
    problems.push({
      id: "none",
      titleKey: "dm.noProblem",
      detailKey: "dm.noProblem",
      fixKey: "dm.fixNone",
      vars: { models: modelsLabel, shop: shopLabel },
    });
  }

  return (
    <Card title={t("dm.title")}>
      <p className="-mt-1 text-xs text-muted">{t("dm.subtitle")}</p>

      <div
        aria-live="polite"
        className={`mt-3 flex items-start gap-2 rounded-[var(--card-radius)] border border-line border-l-[3px] px-3 py-2.5 ${
          stableService
            ? "border-l-clear-ink bg-clear/10"
            : "border-l-coating bg-coating-soft"
        }`}
      >
        <TriangleExclamationPoint
          size={15}
          aria-hidden="true"
          className={`mt-0.5 shrink-0 ${stableService ? "text-clear-ink" : "text-brand-ink"}`}
        />
        <div>
          <p
            className={`text-[0.8125rem] font-semibold ${stableService ? "text-clear-ink" : "text-ink"}`}
          >
            {t("dm.alertTitle")}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink">{alert}</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-1.5 pr-3 font-medium">
                {t("dm.colIndicator")}
              </th>
              <th className="py-1.5 pr-3 font-medium">{t("dm.colValue")}</th>
              <th className="py-1.5 font-medium">{t("dm.colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-line/60 last:border-0"
              >
                <td className="py-2 pr-3 align-top font-medium text-ink">
                  {row.label}
                  <span className="mt-0.5 block text-[0.75rem] font-normal text-muted">
                    {row.note}
                  </span>
                </td>
                <td className="py-2 pr-3 align-top font-display text-base font-semibold tabular-nums text-brand-ink">
                  {row.value}
                </td>
                <td className="py-2 align-top text-muted">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <details className="rounded-xl border border-line bg-panel" open>
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[0.8125rem] font-medium text-ink">
            {t("dm.meaningTitle")}
            <ChevronDown size={14} aria-hidden="true" className="text-muted" />
          </summary>
          <div className="space-y-3 border-t border-line px-4 py-4 text-sm leading-relaxed text-muted">
            <p className="font-medium text-ink">{t("dm.problemsTitle")}</p>
            <ol className="list-decimal space-y-3 pl-4">
              {problems.map((problem) => (
                <li key={problem.id}>
                  <span className="font-medium text-ink">
                    {t(problem.titleKey, problem.vars)}
                  </span>
                  {problem.detailKey !== problem.titleKey && (
                    <span className="block text-muted">
                      {t(problem.detailKey, problem.vars)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </details>
        <details className="rounded-xl border border-line bg-panel" open>
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[0.8125rem] font-medium text-ink">
            {t("dm.actionsTitle")}
            <ChevronDown size={14} aria-hidden="true" className="text-muted" />
          </summary>
          <div className="border-t border-line px-4 py-4 text-sm leading-relaxed text-muted">
            <p>{t("dm.actionsIntro")}</p>
            <ol className="mt-1.5 list-decimal space-y-3 pl-4">
              {problems.map((problem) => (
                <li key={problem.id}>{t(problem.fixKey, problem.vars)}</li>
              ))}
            </ol>
          </div>
        </details>
      </div>
    </Card>
  );
}
