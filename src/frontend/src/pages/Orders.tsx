import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Loader2, Phone, StickyNote } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { type Order, OrderStatus } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import { useAllOrders, useUpdateOrderStatus } from "../hooks/useQueries";

const COLUMNS: { status: OrderStatus; label: string; color: string }[] = [
  {
    status: OrderStatus.new_,
    label: "New",
    color: "border-t-[3px] border-t-[oklch(0.82_0.19_85)]",
  },
  {
    status: OrderStatus.preparing,
    label: "Preparing",
    color: "border-t-[3px] border-t-[oklch(0.62_0.18_240)]",
  },
  {
    status: OrderStatus.ready,
    label: "Ready",
    color: "border-t-[3px] border-t-[oklch(0.68_0.18_155)]",
  },
  {
    status: OrderStatus.delivered,
    label: "Delivered",
    color: "border-t-[3px] border-t-muted-foreground",
  },
  {
    status: OrderStatus.cancelled,
    label: "Cancelled",
    color: "border-t-[3px] border-t-destructive",
  },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.new_]: OrderStatus.preparing,
  [OrderStatus.preparing]: OrderStatus.ready,
  [OrderStatus.ready]: OrderStatus.delivered,
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.new_]: "Start Prep",
  [OrderStatus.preparing]: "Mark Ready",
  [OrderStatus.ready]: "Deliver",
};

function OrderCard({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus();

  const formatTime = (ns: bigint) => {
    const ms = Number(ns / 1_000_000n);
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = NEXT_LABEL[order.status];

  async function handleAdvance() {
    if (!nextStatus) return;
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: nextStatus });
      toast.success(
        `Order #${String(order.id).padStart(4, "0")} ${nextLabel?.toLowerCase()}`,
      );
    } catch {
      toast.error("Failed to update order status");
    }
  }

  async function handleCancel() {
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: OrderStatus.cancelled,
      });
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
    }
  }

  return (
    <Card className="kitchen-card text-sm animate-slide-up">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-mono text-xs text-muted-foreground">
              #{String(order.id).padStart(4, "0")}
            </span>
            <div className="font-display font-semibold text-base leading-tight">
              {order.customerName}
            </div>
          </div>
          <span className="font-display text-sm font-bold text-primary">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Phone className="w-3 h-3" />
          {order.customerPhone}
          <span className="ml-auto">{formatTime(order.createdAt)}</span>
        </div>

        <div className="space-y-1 mb-3">
          {order.items.map((item) => (
            <div
              key={String(item.menuItemId)}
              className="flex items-center justify-between text-xs"
            >
              <span className="font-body">
                <span className="font-medium text-foreground">
                  {Number(item.quantity)}×
                </span>{" "}
                <span className="text-muted-foreground">
                  Item #{String(item.menuItemId)}
                </span>
              </span>
              <span className="text-muted-foreground">
                ${(item.unitPrice * Number(item.quantity)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="flex items-start gap-1.5 bg-accent/50 rounded p-2 mb-3 text-xs">
            <StickyNote className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
            <span className="font-body text-muted-foreground">
              {order.notes}
            </span>
          </div>
        )}

        <div className="flex gap-1.5">
          {nextStatus && (
            <Button
              size="sm"
              className="flex-1 h-7 text-xs ember-gradient text-white border-0"
              onClick={handleAdvance}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  {nextLabel}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          )}
          {(order.status === OrderStatus.new_ ||
            order.status === OrderStatus.preparing) && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={handleCancel}
              disabled={updateStatus.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Orders() {
  const { data: orders, isLoading } = useAllOrders();

  const groupedOrders = useMemo(() => {
    const groups: Record<OrderStatus, Order[]> = {
      [OrderStatus.new_]: [],
      [OrderStatus.preparing]: [],
      [OrderStatus.ready]: [],
      [OrderStatus.delivered]: [],
      [OrderStatus.cancelled]: [],
    };
    for (const o of orders ?? []) {
      groups[o.status].push(o);
    }
    // Sort by createdAt ascending within each column
    for (const arr of Object.values(groups)) {
      arr.sort((a, b) => Number(a.createdAt - b.createdAt));
    }
    return groups;
  }, [orders]);

  return (
    <div className="p-6 space-y-4 animate-fade-in h-full flex flex-col">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Orders
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          {orders?.length ?? 0} total orders
        </p>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="shrink-0 w-60">
              <Skeleton className="h-8 w-full mb-3" />
              <div className="space-y-2">
                {["c1", "c2", "c3"].map((k) => (
                  <Skeleton key={k} className="h-32 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {COLUMNS.map((col) => {
            const colOrders = groupedOrders[col.status];
            return (
              <div
                key={col.status}
                className="shrink-0 w-64 flex flex-col min-h-0"
              >
                <div className={`rounded-md bg-card border mb-3 ${col.color}`}>
                  <CardHeader className="py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm uppercase tracking-wider">
                        {col.label}
                      </span>
                      <span className="bg-secondary text-secondary-foreground text-xs font-bold rounded px-2 py-0.5">
                        {colOrders.length}
                      </span>
                    </div>
                  </CardHeader>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-1">
                    {colOrders.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed border-border rounded-md font-body">
                        No orders
                      </div>
                    ) : (
                      colOrders.map((order) => (
                        <OrderCard key={String(order.id)} order={order} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
