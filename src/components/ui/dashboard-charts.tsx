"use client";

import { useMemo, useState } from "react";

type TrendItem = {
  label: string;
  primary: number;
  secondary: number;
};

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold transition ${
        active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-white hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

function LegendButton({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-bold transition ${
        active ? "border-slate-900 bg-slate-900 text-white" : "border-[var(--line)] bg-[var(--panel)] text-slate-600 hover:border-slate-400"
      }`}
    >
      <span className="h-2.5 w-2.5" style={{ backgroundColor: color }} />
      {label}
    </button>
  );
}

function buildLinePoints(values: number[], maxValue: number, width: number, height: number, padding: number) {
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x = padding + (usableWidth / Math.max(values.length - 1, 1)) * index;
      const y = padding + usableHeight - (value / Math.max(maxValue, 1)) * usableHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

export function TrendBarChart({
  data,
  primaryLabel = "Tahsilat",
  secondaryLabel = "Ödeme",
  primaryColor = "#4c6f8b",
  secondaryColor = "#111827",
}: {
  data: TrendItem[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(data.length - 1);
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(true);
  const [mode, setMode] = useState<"bar" | "line">("bar");

  const maxValue = useMemo(() => {
    const values = data.flatMap((item) => [showPrimary ? item.primary : 0, showSecondary ? item.secondary : 0]);
    return Math.max(...values, 1);
  }, [data, showPrimary, showSecondary]);

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const lineWidth = 640;
  const lineHeight = 260;
  const linePadding = 24;
  const primaryPoints = buildLinePoints(
    data.map((item) => (showPrimary ? item.primary : 0)),
    maxValue,
    lineWidth,
    lineHeight,
    linePadding,
  );
  const secondaryPoints = buildLinePoints(
    data.map((item) => (showSecondary ? item.secondary : 0)),
    maxValue,
    lineWidth,
    lineHeight,
    linePadding,
  );

  return (
    <div className="border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-4 flex flex-col gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Grafiğin üzerine gelerek ay bazlı detayı inceleyebilirsin.</p>
            {activeItem ? (
              <p className="mt-1 text-sm font-extrabold text-slate-900">
                {activeItem.label}: {showPrimary ? `${primaryLabel} ${money(activeItem.primary)}` : ""}
                {showPrimary && showSecondary ? " · " : ""}
                {showSecondary ? `${secondaryLabel} ${money(activeItem.secondary)}` : ""}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex border border-[var(--line)] bg-[var(--panel-soft)] p-1">
              <ToggleButton label="Sütun" active={mode === "bar"} onClick={() => setMode("bar")} />
              <ToggleButton label="Çizgi" active={mode === "line"} onClick={() => setMode("line")} />
            </div>
            <LegendButton label={primaryLabel} color={primaryColor} active={showPrimary} onClick={() => setShowPrimary((current) => !current)} />
            <LegendButton label={secondaryLabel} color={secondaryColor} active={showSecondary} onClick={() => setShowSecondary((current) => !current)} />
          </div>
        </div>
      </div>

      {mode === "bar" ? (
        <div className="relative h-[300px] overflow-hidden border border-[var(--line)] bg-[var(--panel-soft)] px-4 pb-10 pt-6">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = `${100 - ratio * 100}%`;
            return (
              <div key={ratio} className="pointer-events-none absolute inset-x-4" style={{ top: y }}>
                <div className="border-t border-dashed border-slate-200" />
                <span className="absolute -top-3 left-0 bg-white/90 px-1.5 text-[10px] font-bold text-slate-400">
                  {money(maxValue * ratio)}
                </span>
              </div>
            );
          })}

          <div className="relative flex h-full items-end gap-2">
            {data.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const primaryHeight = Math.max((item.primary / maxValue) * 100, item.primary > 0 ? 3 : 0);
              const secondaryHeight = Math.max((item.secondary / maxValue) * 100, item.secondary > 0 ? 3 : 0);

              return (
                <div
                  key={item.label}
                  className="relative flex h-full min-w-0 flex-1 flex-col justify-end"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                >
                  {isHovered ? (
                    <div className="pointer-events-none absolute left-1/2 top-2 z-10 w-[176px] -translate-x-1/2 border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-xs">
                      <p className="font-black text-slate-900">{item.label}</p>
                      {showPrimary ? (
                        <p className="mt-1 flex items-center justify-between gap-2 text-slate-600">
                          <span>{primaryLabel}</span>
                          <span className="font-extrabold text-slate-950">{money(item.primary)}</span>
                        </p>
                      ) : null}
                      {showSecondary ? (
                        <p className="mt-1 flex items-center justify-between gap-2 text-slate-600">
                          <span>{secondaryLabel}</span>
                          <span className="font-extrabold text-slate-950">{money(item.secondary)}</span>
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className={`flex h-full items-end justify-center gap-2 px-1 pb-8 pt-12 transition ${isHovered ? "bg-white/80" : ""}`}>
                    {showPrimary ? (
                      <button
                        type="button"
                        onMouseEnter={() => setHoveredIndex(index)}
                        className={`relative w-full max-w-[22px] transition duration-200 ${isHovered ? "opacity-100" : "opacity-90"}`}
                        style={{ height: `${primaryHeight}%`, backgroundColor: primaryColor }}
                        aria-label={`${item.label} ${primaryLabel} ${money(item.primary)}`}
                      />
                    ) : null}
                    {showSecondary ? (
                      <button
                        type="button"
                        onMouseEnter={() => setHoveredIndex(index)}
                        className={`relative w-full max-w-[22px] transition duration-200 ${isHovered ? "opacity-100" : "opacity-90"}`}
                        style={{ height: `${secondaryHeight}%`, backgroundColor: secondaryColor }}
                        aria-label={`${item.label} ${secondaryLabel} ${money(item.secondary)}`}
                      />
                    ) : null}
                  </div>

                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-bold ${isHovered ? "text-slate-950" : "text-slate-500"}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="relative border border-[var(--line)] bg-[var(--panel-soft)] p-4">
          <svg viewBox={`0 0 ${lineWidth} ${lineHeight}`} className="h-[280px] w-full">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = linePadding + (lineHeight - linePadding * 2) - (lineHeight - linePadding * 2) * ratio;
              return (
                <g key={ratio}>
                  <line x1={linePadding} y1={y} x2={lineWidth - linePadding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <text x={linePadding - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                    {money(maxValue * ratio)}
                  </text>
                </g>
              );
            })}

            {showPrimary ? <polyline fill="none" stroke={primaryColor} strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" points={primaryPoints} /> : null}
            {showSecondary ? <polyline fill="none" stroke={secondaryColor} strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" points={secondaryPoints} /> : null}

            {data.map((item, index) => {
              const x = linePadding + ((lineWidth - linePadding * 2) / Math.max(data.length - 1, 1)) * index;
              const primaryY = linePadding + (lineHeight - linePadding * 2) - (item.primary / maxValue) * (lineHeight - linePadding * 2);
              const secondaryY = linePadding + (lineHeight - linePadding * 2) - (item.secondary / maxValue) * (lineHeight - linePadding * 2);
              const isHovered = hoveredIndex === index;

              return (
                <g key={item.label}>
                  <rect x={x - 28} y={0} width={56} height={lineHeight} fill="transparent" onMouseEnter={() => setHoveredIndex(index)} />
                  {showPrimary ? <rect x={x - (isHovered ? 5 : 4)} y={primaryY - (isHovered ? 5 : 4)} width={isHovered ? 10 : 8} height={isHovered ? 10 : 8} fill={primaryColor} /> : null}
                  {showSecondary ? <rect x={x - (isHovered ? 5 : 4)} y={secondaryY - (isHovered ? 5 : 4)} width={isHovered ? 10 : 8} height={isHovered ? 10 : 8} fill={secondaryColor} /> : null}
                  <text x={x} y={lineHeight - 6} textAnchor="middle" fontSize="11" fill={isHovered ? "#0f172a" : "#64748b"}>
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {activeItem ? (
            <div className="mt-3 border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-xs">
              <p className="font-black text-slate-900">{activeItem.label}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-slate-600">
                {showPrimary ? (
                  <span>
                    {primaryLabel}: <strong className="text-slate-950">{money(activeItem.primary)}</strong>
                  </span>
                ) : null}
                {showSecondary ? (
                  <span>
                    {secondaryLabel}: <strong className="text-slate-950">{money(activeItem.secondary)}</strong>
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function DonutMetricChart({
  title,
  value,
  total,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  total: number;
  color: string;
  subtitle: string;
}) {
  const safeTotal = Math.max(total, 1);
  const ratio = Math.min(Math.max(value / safeTotal, 0), 1);
  const size = 132;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="border border-[var(--line)] bg-[var(--panel)] p-4 text-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-32 w-32 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#cbd5e1" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        >
          <title>{`${title}: ${money(value)}`}</title>
        </circle>
      </svg>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{money(value)}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
