import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import {
  MenuItem,
  Order,
  OrderStatus,
  InventoryItem,
  OrderItem,
  UserRole,
  UserProfile,
} from "../backend.d";

// ─── Menu ────────────────────────────────────────────────────────────────────
export function useAvailableMenuItems() {
  const { actor, isFetching } = useActor();
  return useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableMenuItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      price: number;
      category: string;
      imageUrl: string;
    }) =>
      actor!.createMenuItem(
        data.name,
        data.description,
        data.price,
        data.category,
        data.imageUrl
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: bigint;
      name: string;
      description: string;
      price: number;
      category: string;
      imageUrl: string;
    }) =>
      actor!.updateMenuItem(
        data.id,
        data.name,
        data.description,
        data.price,
        data.category,
        data.imageUrl
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteMenuItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });
}

export function useToggleMenuItemAvailability() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.toggleMenuItemAvailability(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export function useAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useOrdersByStatus(status: OrderStatus) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders", status],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrdersByStatus(status);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useActiveOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["activeOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const [newOrders, preparingOrders] = await Promise.all([
        actor.getOrdersByStatus(OrderStatus.new_),
        actor.getOrdersByStatus(OrderStatus.preparing),
      ]);
      return [...newOrders, ...preparingOrders];
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerName: string;
      customerPhone: string;
      items: OrderItem[];
      notes: string;
    }) =>
      actor!.placeOrder(
        data.customerName,
        data.customerPhone,
        data.items,
        data.notes
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { orderId: bigint; status: OrderStatus }) =>
      actor!.updateOrderStatus(data.orderId, data.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["activeOrders"] });
    },
  });
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export function useInventoryItems() {
  const { actor, isFetching } = useActor();
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (!actor) return [];
      // Get all orders to infer inventory — but actually we need all inventory
      // There's no getAllInventoryItems, so we work with what we have
      // We'll track inventory via local state augmented with getLowStockItems
      return [];
    },
    enabled: false, // Disabled — see useInventoryWithLowStock
  });
}

export function useLowStockItems() {
  const { actor, isFetching } = useActor();
  return useQuery<InventoryItem[]>({
    queryKey: ["lowStock"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLowStockItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateInventoryItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      unit: string;
      quantity: number;
      lowStockThreshold: number;
    }) =>
      actor!.createInventoryItem(
        data.name,
        data.unit,
        data.quantity,
        data.lowStockThreshold
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["lowStock"] });
      qc.invalidateQueries({ queryKey: ["inventoryAll"] });
    },
  });
}

export function useUpdateInventoryItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: bigint;
      name: string;
      unit: string;
      quantity: number;
      lowStockThreshold: number;
    }) =>
      actor!.updateInventoryItem(
        data.id,
        data.name,
        data.unit,
        data.quantity,
        data.lowStockThreshold
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["lowStock"] });
      qc.invalidateQueries({ queryKey: ["inventoryAll"] });
    },
  });
}

export function useDeleteInventoryItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => actor!.deleteInventoryItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["lowStock"] });
      qc.invalidateQueries({ queryKey: ["inventoryAll"] });
    },
  });
}

export function useUpdateStockLevel() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: bigint; quantity: number }) =>
      actor!.updateStockLevel(data.id, data.quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["lowStock"] });
      qc.invalidateQueries({ queryKey: ["inventoryAll"] });
    },
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export function useRevenueAndOrderCount(startTime: bigint, endTime: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<{ revenue: number; orderCount: bigint }>({
    queryKey: ["revenueCount", startTime.toString(), endTime.toString()],
    queryFn: async () => {
      if (!actor) return { revenue: 0, orderCount: 0n };
      return actor.getRevenueAndOrderCount(startTime, endTime);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDailyBreakdown(startTime: bigint, endTime: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dailyBreakdown", startTime.toString(), endTime.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDailyBreakdown(startTime, endTime);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTopSellingItems(limit: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["topSelling", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopSellingItems(limit);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Auth / User ─────────────────────────────────────────────────────────────
export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => actor!.saveCallerUserProfile(profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProfile"] }),
  });
}

export function useAssignAdminRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ principal }: { principal: import("@icp-sdk/core/principal").Principal }) =>
      actor!.assignCallerUserRole(principal, UserRole.admin),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["isAdmin"] }),
  });
}
