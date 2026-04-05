type TrendItem = {
  label: string;
  sales: number;
  collections: number;
};

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function TrendBarChart({ data }: { data: TrendItem[] }) {
  const width = 520;
  const height = 230;
  const padding = { top: 12, right: 16, bottom: 34, left: 16 };
  const innerHeight = height - padding.top - padding.bottom;
  const columnWidth = (width - padding.left - padding.right) / Math.max(data.length, 1);
  const maxValue = Math.max(...data.flatMap((item) => [item.sales, item.collections]), 1);

  return (
    <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[230px] w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + innerHeight - innerHeight * ratio;
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#dbe2ea" strokeDasharray="4 4" />
              <text x={width - padding.right + 4} y={y + 4} fontSize="10" fill="#7b8a9d">
                {money(maxValue * ratio)}
              </text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const groupX = padding.left + index * columnWidth;
          const barWidth = Math.min(18, columnWidth * 0.26);
          const salesHeight = (item.sales / maxValue) * innerHeight;
          const collectionsHeight = (item.collections / maxValue) * innerHeight;
          const salesX = groupX + columnWidth * 0.26;
          const collectionsX = salesX + barWidth + 8;
          const salesY = padding.top + innerHeight - salesHeight;
          const collectionsY = padding.top + innerHeight - collectionsHeight;

          return (
            <g key={item.label}>
              <rect x={salesX} y={salesY} width={barWidth} height={Math.max(salesHeight, 4)} rx="6" fill="#cbd5e1">
                <title>{`${item.label} satış: ${money(item.sales)}`}</title>
              </rect>
              <rect x={collectionsX} y={collectionsY} width={barWidth} height={Math.max(collectionsHeight, 4)} rx="6" fill="var(--brand)">
                <title>{`${item.label} tahsilat: ${money(item.collections)}`}</title>
              </rect>
              <text x={groupX + columnWidth / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#6b7280">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex items-center gap-5 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-300" />Satış</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[var(--brand)]" />Tahsilat</span>
      </div>
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
    <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-32 w-32 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#cbd5e1" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
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
