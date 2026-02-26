/**
 * Since the backend doesn't have a getAllInventoryItems method,
 * we manage a client-side cache of all inventory items.
 * Items are added via createInventoryItem and tracked in React Query.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InventoryItem } from "../backend.d";

const INVENTORY_ALL_KEY = "inventoryAll";

export function useInventoryAll() {
  return useQuery<InventoryItem[]>({
    queryKey: [INVENTORY_ALL_KEY],
    queryFn: () => [],
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: [],
  });
}

export function useAddToInventoryCache() {
  const qc = useQueryClient();
  return (item: InventoryItem) => {
    qc.setQueryData<InventoryItem[]>([INVENTORY_ALL_KEY], (prev) => {
      if (!prev) return [item];
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.map((i) => (i.id === item.id ? item : i));
      return [...prev, item];
    });
  };
}

export function useRemoveFromInventoryCache() {
  const qc = useQueryClient();
  return (id: bigint) => {
    qc.setQueryData<InventoryItem[]>([INVENTORY_ALL_KEY], (prev) =>
      prev ? prev.filter((i) => i.id !== id) : []
    );
  };
}

export function useUpdateInventoryCache() {
  const qc = useQueryClient();
  return (item: InventoryItem) => {
    qc.setQueryData<InventoryItem[]>([INVENTORY_ALL_KEY], (prev) => {
      if (!prev) return [item];
      return prev.map((i) => (i.id === item.id ? item : i));
    });
  };
}
