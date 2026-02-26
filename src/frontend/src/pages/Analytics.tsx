import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDailyBreakdown, useTopSellingItems, useRevenueAndOrderCount } from "../hooks/useQueries";
import { TrendingUp, ShoppingBag, Trophy } from "lucide-react";

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export default function Analytics() {
  const [rangeDays, setRangeDays] = useState(30);

  const { startTime, endTime } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - rangeDays);
    start.setHours(0, 0, 0, 0);
    return {
      startTime: BigInt(start.getTime()) * 1_000_000n,
      endTime: BigInt(end.getTime()) * 1_000_000n,
    };
  }, [rangeDays]);

  const { data: summary, isLoading: summaryLoading } = useRevenueAndOrderCount(startTime, endTime);
  const { data: dailyData, isLoading: dailyLoading } = useDailyBreakdown(startTime, endTime);
  const { data: topItems, isLoading: topLoading } = useTopSellingItems(10n);

  const chartData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData
      .map((d) => ({
        date: new Date(Number(d.date / 1_000_000n)).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: d.revenue,
        orders: Number(d.orderCount),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyData]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Performance overview
          </p>
        </div>
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map(({ label, days }) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              className={`px-3 py-1.5 rounded text-xs font-display font-semibold tracking-wider uppercase transition-all ${
                rangeDays === days
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="kitchen-card animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Total Revenue
                </p>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {formatCurrency(summary?.revenue ?? 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1 font-body">
                  Last {rangeDays} days
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card animate-slide-up delay-100">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Total Orders
                </p>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {Number(summary?.orderCount ?? 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1 font-body">
                  Last {rangeDays} days
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart */}
      <Card className="kitchen-card animate-slide-up delay-200">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl">Daily Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground font-body text-sm">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fontFamily: "IBM Plex Sans", fill: "oklch(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fontFamily: "IBM Plex Sans", fill: "oklch(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{
                    background: "oklch(var(--popover))",
                    border: "1px solid oklch(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "IBM Plex Sans",
                  }}
                />
                <Bar dataKey="revenue" fill="oklch(0.72 0.19 48)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Order count chart */}
      <Card className="kitchen-card animate-slide-up delay-300">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl">Daily Order Count</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground font-body text-sm">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fontFamily: "IBM Plex Sans", fill: "oklch(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fontFamily: "IBM Plex Sans", fill: "oklch(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(var(--popover))",
                    border: "1px solid oklch(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "IBM Plex Sans",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="oklch(0.72 0.19 155)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "oklch(0.72 0.19 155)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top selling items */}
      <Card className="kitchen-card animate-slide-up delay-400">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-xl">Top Selling Items</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {topLoading ? (
            <div className="space-y-3">
              {(["t1","t2","t3","t4","t5"]).map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : !topItems || topItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground font-body text-sm">
              No sales data yet
            </div>
          ) : (
            <div className="space-y-2">
              {topItems.map((item, index) => {
                const maxQty = Number(topItems[0]?.totalQuantity ?? 1n);
                const pct = (Number(item.totalQuantity) / maxQty) * 100;
                return (
                  <div key={String(item.menuItemId)} className="flex items-center gap-3">
                    <span className="font-display text-sm font-bold text-muted-foreground w-5 text-right shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-sm font-medium truncate">
                          {item.menuItemName}
                        </span>
                        <span className="font-display text-sm font-bold text-primary ml-2 shrink-0">
                          {Number(item.totalQuantity)} sold
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full ember-gradient transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
