import type { DepartmentSlice } from "@/lib/dashboard";

const TOKEN_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
// Past the theme's chart tokens, spread hues by the golden angle so slices stay distinguishable.
const colorAt = (i: number) =>
  i < TOKEN_COLORS.length ? TOKEN_COLORS[i] : `hsl(${(i * 137.5) % 360} 55% 50%)`;

const R = 70;
const STROKE = 28;
const C = 2 * Math.PI * R;

export function DepartmentDonut({ slices }: { slices: DepartmentSlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const arcs = slices.reduce<
    (DepartmentSlice & { color: string; length: number; offset: number })[]
  >((acc, s, i) => {
    const prev = acc[acc.length - 1];
    const offset = prev ? prev.offset + prev.length : 0;
    return [...acc, { ...s, color: colorAt(i), length: (s.count / total) * C, offset }];
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-md overflow-y-auto">
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Employees by department, ${total} in total`}
        className="h-44 w-44 shrink-0 -rotate-90"
      >
        {arcs.map((a) => (
          <circle
            key={a.department}
            cx={100}
            cy={100}
            r={R}
            fill="none"
            stroke={a.color}
            strokeWidth={STROKE}
            strokeDasharray={`${a.length} ${C - a.length}`}
            strokeDashoffset={-a.offset}
          >
            <title>{`${a.department}: ${a.count}`}</title>
          </circle>
        ))}
      </svg>
      <ul className="flex flex-wrap justify-center gap-x-md gap-y-xs text-label-sm">
        {arcs.map((a) => (
          <li key={a.department} className="flex items-center gap-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: a.color }}
            />
            {a.department} ({a.count})
          </li>
        ))}
      </ul>
    </div>
  );
}
