import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, Package, AlertTriangle } from "lucide-react";
import {
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useUpdateStockLevel,
} from "../hooks/useQueries";
import {
  useInventoryAll,
  useAddToInventoryCache,
  useUpdateInventoryCache,
  useRemoveFromInventoryCache,
} from "../hooks/useInventoryAll";
import { InventoryItem } from "../backend.d";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InventoryFormData {
  name: string;
  unit: string;
  quantity: string;
  lowStockThreshold: string;
}

const EMPTY_FORM: InventoryFormData = {
  name: "",
  unit: "",
  quantity: "",
  lowStockThreshold: "",
};

export default function Inventory() {
  const { data: items } = useInventoryAll();
  const addToCache = useAddToInventoryCache();
  const updateInCache = useUpdateInventoryCache();
  const removeFromCache = useRemoveFromInventoryCache();

  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const updateStock = useUpdateStockLevel();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<InventoryFormData>(EMPTY_FORM);
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});

  function openCreate() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity.toString(),
      lowStockThreshold: item.lowStockThreshold.toString(),
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quantity = parseFloat(form.quantity);
    const lowStockThreshold = parseFloat(form.lowStockThreshold);
    if (isNaN(quantity) || isNaN(lowStockThreshold)) {
      toast.error("Please enter valid numbers");
      return;
    }
    try {
      if (editingItem) {
        const updated = await updateItem.mutateAsync({
          id: editingItem.id,
          name: form.name,
          unit: form.unit,
          quantity,
          lowStockThreshold,
        });
        updateInCache(updated);
        toast.success("Item updated");
      } else {
        const created = await createItem.mutateAsync({
          name: form.name,
          unit: form.unit,
          quantity,
          lowStockThreshold,
        });
        addToCache(created);
        toast.success("Item added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save item");
    }
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteItem.mutateAsync(id);
      removeFromCache(id);
      toast.success("Item deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete item");
    }
  }

  async function handleStockUpdate(item: InventoryItem) {
    const raw = editingStock[String(item.id)];
    if (raw === undefined) return;
    const qty = parseFloat(raw);
    if (isNaN(qty) || qty < 0) {
      toast.error("Invalid quantity");
      return;
    }
    try {
      const updated = await updateStock.mutateAsync({ id: item.id, quantity: qty });
      updateInCache(updated);
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[String(item.id)];
        return next;
      });
      toast.success("Stock updated");
    } catch {
      toast.error("Failed to update stock");
    }
  }

  const lowStockItems = items?.filter((i) => i.quantity <= i.lowStockThreshold) ?? [];
  const isSaving = createItem.isPending || updateItem.isPending;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            {items?.length ?? 0} items • {lowStockItems.length} low stock
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 ember-gradient text-white border-0">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm font-body text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>{lowStockItems.length}</strong> item
            {lowStockItems.length > 1 ? "s are" : " is"} running low:
            {" "}
            {lowStockItems.map((i) => i.name).join(", ")}
          </span>
        </div>
      )}

      <Card className="kitchen-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-xl">Stock Levels</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items === undefined ? (
            <div className="p-4 space-y-3">
              {(["i1","i2","i3","i4"]).map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="font-display text-xl font-bold text-foreground">
                No inventory items
              </h3>
              <p className="text-muted-foreground font-body text-sm mt-1">
                Add ingredients to track your stock levels
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs uppercase tracking-wider text-muted-foreground">
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Low Stock Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isLow = item.quantity <= item.lowStockThreshold;
                    const stockKey = String(item.id);
                    const editing = stockKey in editingStock;
                    return (
                      <TableRow
                        key={stockKey}
                        className={cn(
                          "font-body text-sm transition-colors",
                          isLow && "bg-destructive/5"
                        )}
                      >
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {editing ? (
                              <>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={editingStock[stockKey]}
                                  onChange={(e) =>
                                    setEditingStock((p) => ({
                                      ...p,
                                      [stockKey]: e.target.value,
                                    }))
                                  }
                                  className="h-7 w-24 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleStockUpdate(item);
                                    if (e.key === "Escape")
                                      setEditingStock((p) => {
                                        const n = { ...p };
                                        delete n[stockKey];
                                        return n;
                                      });
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  className="h-7 text-xs ember-gradient text-white border-0"
                                  onClick={() => handleStockUpdate(item)}
                                  disabled={updateStock.isPending}
                                >
                                  {updateStock.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingStock((p) => ({
                                    ...p,
                                    [stockKey]: item.quantity.toString(),
                                  }))
                                }
                                className={cn(
                                  "font-mono font-bold hover:underline cursor-pointer text-left",
                                  isLow ? "text-destructive" : "text-foreground"
                                )}
                              >
                                {item.quantity}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.lowStockThreshold}
                        </TableCell>
                        <TableCell>
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              Low
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">OK</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(item)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-name" className="font-body text-sm">Name *</Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Chicken Breast"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-unit" className="font-body text-sm">Unit *</Label>
              <Input
                id="inv-unit"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                required
                placeholder="e.g. kg, L, pcs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-qty" className="font-body text-sm">Quantity *</Label>
                <Input
                  id="inv-qty"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                  required
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-threshold" className="font-body text-sm">
                  Low Stock Threshold *
                </Label>
                <Input
                  id="inv-threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, lowStockThreshold: e.target.value }))
                  }
                  required
                  placeholder="5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="ember-gradient text-white border-0">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Delete Item?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This will permanently remove the inventory item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && handleDelete(deleteId)}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
