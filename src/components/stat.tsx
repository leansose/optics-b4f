type Tone = "ink" | "signal" | "clear";

const text: Record<Tone, string> = {
  ink: "text-ink",
  signal: "text-signal-ink",
  clear: "text-clear-ink",
};
const border: Record<Tone, string> = {
  ink: "border-line",
  signal: "border-signal",
  clear: "border-clear",
};

type Props = {
  value: string;
  label: string;
  note?: string;
  tone?: Tone;
};

export function Stat({ value, label, note, tone = "ink" }: Props) {
  return (
    <div className={`border-l-[3px] pl-3.5 ${border[tone]}`}>
      <p
        className={`font-display text-[1.75rem] leading-[1.05] font-semibold tracking-[-0.02em] tabular-nums ${text[tone]}`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[0.8125rem] text-ink">{label}</p>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </div>
  );
}
