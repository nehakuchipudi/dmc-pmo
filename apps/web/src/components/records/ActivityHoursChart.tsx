"use client";

export type MonthPoint = { key: string; label: string; activities: number; hours: number };

export function monthSeries(dates: { date: string; hours?: number; activity?: boolean }[]): MonthPoint[] {
  const now = new Date("2026-09-01T12:00:00");
  const keys: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const map = new Map(keys.map((key) => [key, { activities: 0, hours: 0 }]));
  for (const row of dates) {
    const key = row.date.slice(0, 7);
    const cur = map.get(key);
    if (!cur) continue;
    if (row.hours) cur.hours += row.hours;
    if (row.activity) cur.activities += 1;
  }
  return keys.map((key) => {
    const [y, m] = key.split("-");
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short" });
    const point = map.get(key) ?? { activities: 0, hours: 0 };
    return { key, label, ...point };
  });
}

export function ActivityHoursChart({ points }: { points: MonthPoint[] }) {
  const maxAct = Math.max(1, ...points.map((p) => p.activities));
  const maxHrs = Math.max(1, ...points.map((p) => p.hours));
  const w = 420;
  const h = 160;
  const pad = 28;
  const innerW = w - pad * 2;
  const innerH = h - pad * 1.5;
  const gap = innerW / points.length;
  const line = points
    .map((p, i) => {
      const x = pad + gap * i + gap / 2;
      const y = pad * 0.4 + innerH - (p.hours / maxHrs) * innerH;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="spark-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Activities versus hours">
      {points.map((p, i) => {
        const x = pad + gap * i + gap * 0.22;
        const barH = (p.activities / maxAct) * innerH;
        return (
          <rect
            key={p.key}
            x={x}
            y={pad * 0.4 + innerH - barH}
            width={gap * 0.34}
            height={barH}
            rx={3}
            fill="#7BA891"
          />
        );
      })}
      <path d={line} fill="none" stroke="#5B7C99" strokeWidth="2.5" />
      {points.map((p, i) => {
        const x = pad + gap * i + gap / 2;
        return (
          <text key={`${p.key}-l`} x={x} y={h - 4} textAnchor="middle" className="spark-label">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}
