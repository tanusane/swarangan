"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardStats } from "@/lib/admin/dashboard";
import type { MonthPoint, Slice } from "@/lib/students/stats";

/**
 * The dashboard charts, in the logo's colours. Each chart also carries a short
 * text summary for screen readers, since the drawing itself says nothing to them.
 */

const MAGENTA = "#a02f6c";
const BLUE = "#054b96";
const GOLD = "#c9a227";
const PALETTE = [MAGENTA, BLUE, GOLD, "#eea9c7", "#a0c3f2", "#d3c0a6"];
const AXIS = { fontSize: 12, fill: "#6b5b4b" };

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const hasStudents = stats.totals.total > 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active students" value={stats.totals.active} />
        <StatCard label="Paused" value={stats.totals.paused} />
        <StatCard label="Left" value={stats.totals.left} />
        <StatCard label="New enquiries" value={stats.newEnquiries} highlight />
      </div>

      {!hasStudents && (
        <p className="text-ink-muted border-sand-300 rounded-(--radius-card) border border-dashed bg-white p-5 text-sm">
          Add students under the Students tab and the charts below fill in.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Active students by class"
          summary={describe(stats.categories)}
        >
          <PieChart>
            <Pie
              data={stats.categories}
              dataKey="value"
              nameKey="label"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
            >
              {stats.categories.map((slice, i) => (
                <Cell key={slice.key} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" iconType="circle" />
          </PieChart>
        </ChartCard>

        <ChartCard
          title="Active students by level"
          summary={describe(stats.levels)}
        >
          <BarChart data={stats.levels} margin={{ left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={AXIS} interval={0} />
            <YAxis allowDecimals={false} tick={AXIS} />
            <Tooltip />
            <Bar
              dataKey="value"
              name="Students"
              fill={BLUE}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Where active students learn"
          summary={describe(stats.modes)}
        >
          <BarChart data={stats.modes} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={AXIS} />
            <YAxis type="category" dataKey="label" tick={AXIS} width={100} />
            <Tooltip />
            <Bar
              dataKey="value"
              name="Students"
              fill={MAGENTA}
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Joins and enquiries, last 12 months"
          summary={`${sum(stats.joins)} students joined and ${sum(stats.enquiries)} enquiries arrived in the last 12 months.`}
        >
          <LineChart
            data={merge(stats.joins, stats.enquiries)}
            margin={{ left: -16 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={AXIS} />
            <YAxis allowDecimals={false} tick={AXIS} />
            <Tooltip />
            <Legend verticalAlign="bottom" iconType="circle" />
            <Line
              type="monotone"
              dataKey="joins"
              name="Students joined"
              stroke={MAGENTA}
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="enquiries"
              name="Enquiries"
              stroke={GOLD}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-(--radius-card) border p-5 " +
        (highlight && value > 0
          ? "border-magenta-300 bg-magenta-50/50"
          : "border-sand-300 bg-white")
      }
    >
      <p className="text-ink-muted text-sm">{label}</p>
      <p className="mt-1 text-4xl font-(--font-display) text-blue-900">
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactElement;
}) {
  return (
    <section className="border-sand-300 rounded-(--radius-card) border bg-white p-5">
      <h2 className="mb-3 text-lg">{title}</h2>
      <p className="sr-only">{summary}</p>
      <div aria-hidden="true" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const sum = (points: readonly MonthPoint[]) =>
  points.reduce((total, point) => total + point.value, 0);

function describe(slices: readonly Slice[]): string {
  return slices.length === 0
    ? "No data yet."
    : slices.map((slice) => `${slice.label}: ${slice.value}`).join(", ");
}

function merge(joins: readonly MonthPoint[], enquiries: readonly MonthPoint[]) {
  return joins.map((point, i) => ({
    label: point.label,
    joins: point.value,
    enquiries: enquiries[i]?.value ?? 0,
  }));
}
