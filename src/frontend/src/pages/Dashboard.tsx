import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { type Order, OrderStatus } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import { useAllOrders } from "../hooks/useQueries";
import { useLowStockItems } from "../hooks/useQueries";
import { useRevenueAndOrderCount } from "../hooks/useQueries";
import { useActiveSubscriptionCount } from "../hooks/useQueries";

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  loading,
  accentClass,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  loading?: boolean;
  accentClass?: string;
}) {
  return (
    <Card className="kitchen-card animate-slide-up">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="font-display text-3xl font-bold text-foreground">
                {value}
              </p>
            )}
            {sub && (
              <p className="text-xs text-muted-foreground mt-1 font-body">
                {sub}
              </p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center ${accentClass || "bg-primary/10"}`}
          >
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: lowStock, isLoading: stockLoading } = useLowStockItems();
  const { data: activeSubCount, isLoading: subLoading } =
    useActiveSubscriptionCount();

  // Today's time range
  const { startOfDay, endOfDay } = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return {
      startOfDay: BigInt(start.getTime()) * 1_000_000n,
      endOfDay: BigInt(end.getTime()) * 1_000_000n,
    };
  }, []);

  const { data: todayStats, isLoading: statsLoading } = useRevenueAndOrderCount(
    startOfDay,
    endOfDay,
  );

  const pendingOrders = useMemo(
    () =>
      orders?.filter(
        (o) =>
          o.status === OrderStatus.new_ || o.status === OrderStatus.preparing,
      ) ?? [],
    [orders],
  );

  const recentOrders: Order[] = useMemo(
    () =>
      orders
        ? [...orders]
            .sort((a, b) => Number(b.createdAt - a.createdAt))
            .slice(0, 10)
        : [],
    [orders],
  );

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const formatTime = (ns: bigint) => {
    const ms = Number(ns / 1_000_000n);
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Revenue"
          value={statsLoading ? "—" : formatCurrency(todayStats?.revenue ?? 0)}
          icon={TrendingUp}
          loading={statsLoading}
          accentClass="bg-primary/10"
        />
        <StatCard
          title="Total Orders"
          value={statsLoading ? "—" : Number(todayStats?.orderCount ?? 0)}
          icon={ShoppingBag}
          sub="today"
          loading={statsLoading}
          accentClass="bg-primary/10"
        />
        <StatCard
          title="Pending Orders"
          value={ordersLoading ? "—" : pendingOrders.length}
          icon={Clock}
          sub="active now"
          loading={ordersLoading}
          accentClass={
            pendingOrders.length > 5 ? "bg-destructive/10" : "bg-primary/10"
          }
        />
        <StatCard
          title="Active Subscriptions"
          value={subLoading ? "—" : Number(activeSubCount ?? 0n)}
          icon={CalendarDays}
          sub="subscribers"
          loading={subLoading}
          accentClass="bg-primary/10"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stockLoading ? "—" : (lowStock?.length ?? 0)}
          icon={AlertTriangle}
          sub="items need restock"
          loading={stockLoading}
          accentClass={
            (lowStock?.length ?? 0) > 0 ? "bg-destructive/10" : "bg-primary/10"
          }
        />
      </div>

      {/* Low stock warning */}
      {(lowStock?.length ?? 0) > 0 && (
        <Card className="border-destructive/50 bg-destructive/5 animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="font-body text-sm font-medium text-destructive">
                  {lowStock?.length} item
                  {(lowStock?.length ?? 0) > 1 ? "s" : ""} running low on stock
                </span>
              </div>
              <Link to="/inventory">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-body"
                >
                  Manage <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStock?.map((item) => (
                <Badge
                  key={String(item.id)}
                  variant="destructive"
                  className="font-body text-xs"
                >
                  {item.name}: {item.quantity} {item.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card className="kitchen-card animate-slide-up delay-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-xl">
              Recent Orders
            </CardTitle>
            <Link to="/orders">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-primary hover:underline font-body"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="p-4 space-y-3">
              {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-body text-sm">
              No orders yet today
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-2">Order</th>
                    <th className="text-left px-4 py-2">Customer</th>
                    <th className="text-left px-4 py-2 hidden sm:table-cell">
                      Items
                    </th>
                    <th className="text-left px-4 py-2">Amount</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={String(order.id)}
                      className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{String(order.id).padStart(4, "0")}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <div>{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.customerPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {formatTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
