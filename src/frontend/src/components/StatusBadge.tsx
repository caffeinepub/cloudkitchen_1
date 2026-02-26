import { OrderStatus } from "../backend.d";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  [OrderStatus.new_]: { label: "New", className: "status-new" },
  [OrderStatus.preparing]: { label: "Preparing", className: "status-preparing" },
  [OrderStatus.ready]: { label: "Ready", className: "status-ready" },
  [OrderStatus.delivered]: { label: "Delivered", className: "status-delivered" },
  [OrderStatus.cancelled]: { label: "Cancelled", className: "status-cancelled" },
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center border rounded font-display font-semibold tracking-wider uppercase",
        config.className,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-sm px-3 py-1",
        size === "lg" && "text-base px-4 py-1.5",
        className
      )}
    >
      {config.label}
    </span>
  );
}
