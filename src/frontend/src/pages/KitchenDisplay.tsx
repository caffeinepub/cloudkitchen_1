import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, Flame, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type Order, OrderStatus } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import { useActiveOrders } from "../hooks/useQueries";

function OrderTicket({ order }: { order: Order }) {
  const isNew = order.status === OrderStatus.new_;

  const createdAt = order.createdAt;

  const getElapsed = useCallback(() => {
    const ms = Date.now() - Number(createdAt / 1_000_000n);
    const mins = Math.floor(ms / 60_000);
    const secs = Math.floor((ms % 60_000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, [createdAt]);

  const [time, setTime] = useState(getElapsed);
  useEffect(() => {
    const timer = setInterval(() => setTime(getElapsed()), 1000);
    return () => clearInterval(timer);
  }, [getElapsed]);

  const ageMinutes = Math.floor(
    (Date.now() - Number(order.createdAt / 1_000_000n)) / 60_000,
  );

  return (
    <Card
      className={cn(
        "kitchen-card transition-all",
        isNew && "border-[oklch(0.82_0.19_85)/60]",
        !isNew && "border-[oklch(0.62_0.18_240)/60]",
        ageMinutes >= 15 && "animate-pulse-ember",
      )}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={order.status} size="md" />
              <span className="font-mono text-sm text-muted-foreground">
                #{String(order.id).padStart(4, "0")}
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
              {order.customerName}
            </h2>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 font-mono text-base font-bold px-3 py-1.5 rounded-md",
              ageMinutes >= 15
                ? "bg-destructive/20 text-destructive"
                : ageMinutes >= 10
                  ? "bg-[oklch(0.82_0.19_85/15)] text-[oklch(0.82_0.19_85)]"
                  : "bg-secondary text-secondary-foreground",
            )}
          >
            <Clock className="w-4 h-4" />
            {time}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {order.items.map((item) => (
            <div
              key={String(item.menuItemId)}
              className="flex items-center gap-3"
            >
              <span
                className={cn(
                  "font-display text-2xl font-black min-w-[2.5rem] text-center",
                  isNew
                    ? "text-[oklch(0.82_0.19_85)]"
                    : "text-[oklch(0.68_0.19_240)]",
                )}
              >
                ×{Number(item.quantity)}
              </span>
              <span className="font-display text-xl font-semibold text-foreground">
                Item #{String(item.menuItemId)}
              </span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="mt-3 bg-accent/50 rounded-md p-3">
            <p className="font-body text-sm font-medium text-foreground">
              📝 {order.notes}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground font-body">
          <span>{order.customerPhone}</span>
          <span className="font-bold text-foreground">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KitchenDisplay() {
  const { data: orders, isLoading, dataUpdatedAt } = useActiveOrders();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (dataUpdatedAt) setLastRefresh(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  const newOrders = orders?.filter((o) => o.status === OrderStatus.new_) ?? [];
  const preparingOrders =
    orders?.filter((o) => o.status === OrderStatus.preparing) ?? [];

  const sortByTime = (arr: Order[]) =>
    [...arr].sort((a, b) => Number(a.createdAt - b.createdAt));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md ember-gradient flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              KITCHEN DISPLAY
            </h1>
            <p className="font-body text-xs text-muted-foreground">
              Auto-refreshes every 10s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-body text-xs">
          <RefreshCw
            className={cn("w-3.5 h-3.5", isLoading && "animate-spin")}
          />
          {lastRefresh.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>

      {isLoading && orders === undefined ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground font-body">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading orders...
        </div>
      ) : (orders?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Flame className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Kitchen is clear!
          </h2>
          <p className="text-muted-foreground font-body mt-2">
            No active orders right now
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New orders */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[oklch(0.82_0.19_85)] animate-pulse" />
              <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wider">
                New Orders
              </h2>
              <span className="bg-[oklch(0.82_0.19_85/15)] text-[oklch(0.82_0.19_85)] text-sm font-bold rounded px-2 py-0.5">
                {newOrders.length}
              </span>
            </div>
            {newOrders.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-md h-28 flex items-center justify-center text-muted-foreground font-body text-sm">
                No new orders
              </div>
            ) : (
              <div className="space-y-3">
                {sortByTime(newOrders).map((order) => (
                  <OrderTicket key={String(order.id)} order={order} />
                ))}
              </div>
            )}
          </div>

          {/* Preparing */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[oklch(0.62_0.18_240)] animate-pulse" />
              <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wider">
                Preparing
              </h2>
              <span className="bg-[oklch(0.62_0.18_240/15)] text-[oklch(0.62_0.18_240)] text-sm font-bold rounded px-2 py-0.5">
                {preparingOrders.length}
              </span>
            </div>
            {preparingOrders.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-md h-28 flex items-center justify-center text-muted-foreground font-body text-sm">
                No orders in preparation
              </div>
            ) : (
              <div className="space-y-3">
                {sortByTime(preparingOrders).map((order) => (
                  <OrderTicket key={String(order.id)} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
