import type { HeadcountPoint } from "@/lib/dashboard";

const W = 480;
const H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00`).toLocaleString("en", { month: "short" });

/** Area/line chart; a null point breaks the line instead of dropping to zero. */
export function HeadcountTrendChart({ points }: { points: HeadcountPoint[] }) {
  const values = points.flatMap((p) => (p.total === null ? [] : [p.total]));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, max);
  const lo = Math.max(0, min - Math.ceil((max - min) * 0.2) - 1);
  const hi = max + Math.ceil((max - min) * 0.2) + 1;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (plotW * i) / (points.length - 1);
  const y = (v: number) => PAD.top + plotH * (1 - (v - lo) / (hi - lo));

  // Consecutive non-null points form one segment.
  const segments: { i: number; total: number }[][] = [];
  points.forEach((p, i) => {
    if (p.total === null) return;
    const last = segments[segments.length - 1];
    if (last && last[last.length - 1].i === i - 1) last.push({ i, total: p.total });
    else segments.push([{ i, total: p.total }]);
  });

  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const summary = `Headcount over the last ${points.length} months`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={summary}
      className="h-full w-full text-primary"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(t)}
            y2={y(t)}
            className="stroke-border"
            strokeDasharray="3 3"
          />
          <text
            x={PAD.left - 6}
            y={y(t)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {t}
          </text>
        </g>
      ))}
      {segments.map((seg) => {
        const line = seg.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i)},${y(p.total)}`).join(" ");
        const area = `${line} L${x(seg[seg.length - 1].i)},${y(lo)} L${x(seg[0].i)},${y(lo)} Z`;
        return (
          <g key={seg[0].i}>
            {seg.length > 1 && <path d={area} className="fill-current opacity-10" />}
            {seg.length > 1 && (
              <path d={line} fill="none" className="stroke-current" strokeWidth={2} />
            )}
            {seg.map((p) => (
              <circle key={p.i} cx={x(p.i)} cy={y(p.total)} r={3} className="fill-current">
                <title>{`${points[p.i].month}: ${p.total}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {points.map((p, i) => (
        <text
          key={p.month}
          x={x(i)}
          y={H - 8}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {monthLabel(p.month)}
        </text>
      ))}
    </svg>
  );
}
