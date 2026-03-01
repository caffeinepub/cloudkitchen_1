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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MenuItem } from "../backend.d";
import {
  useAvailableMenuItems,
  useCreateMenuItem,
  useDeleteMenuItem,
  useToggleMenuItemAvailability,
  useUpdateMenuItem,
} from "../hooks/useQueries";

const CATEGORIES = [
  "Salads",
  "Bowls",
  "Wraps",
  "Toppings",
  "Dressings",
  "Drinks",
  "Specials",
];

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
}

const EMPTY_FORM: MenuFormData = {
  name: "",
  description: "",
  price: "",
  category: "",
  imageUrl: "",
};

export default function MenuManagement() {
  const { data: items, isLoading } = useAvailableMenuItems();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<MenuFormData>(EMPTY_FORM);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredItems = items?.filter(
    (item) => filterCategory === "all" || item.category === filterCategory,
  );

  const categories = ["all", ...CATEGORIES];

  function openCreate() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number.parseFloat(form.price);
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    try {
      if (editingItem) {
        await updateItem.mutateAsync({
          id: editingItem.id,
          name: form.name,
          description: form.description,
          price,
          category: form.category,
          imageUrl: form.imageUrl,
        });
        toast.success("Menu item updated");
      } else {
        await createItem.mutateAsync({
          name: form.name,
          description: form.description,
          price,
          category: form.category,
          imageUrl: form.imageUrl,
        });
        toast.success("Menu item added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save menu item");
    }
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Item deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete item");
    }
  }

  async function handleToggle(id: bigint) {
    try {
      await toggleAvailability.mutateAsync(id);
    } catch {
      toast.error("Failed to update availability");
    }
  }

  const isSaving = createItem.isPending || updateItem.isPending;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Menu
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            {items?.length ?? 0} items
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 ember-gradient text-white border-0"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded text-xs font-display font-semibold tracking-wider uppercase transition-all ${
              filterCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
            <Skeleton key={k} className="h-52 rounded-md" />
          ))}
        </div>
      ) : filteredItems?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="font-display text-xl font-bold text-foreground">
            No items found
          </h3>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Add your first menu item to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems?.map((item) => (
            <Card
              key={String(item.id)}
              className={`kitchen-card overflow-hidden ${!item.isAvailable ? "opacity-60" : ""}`}
            >
              {item.imageUrl && (
                <div className="h-32 bg-muted overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-base leading-tight truncate">
                      {item.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="mt-1 text-xs font-body"
                    >
                      {item.category}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer"
                        onClick={() => openEdit(item)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-destructive"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground font-body mt-1.5 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display text-lg font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-body">
                      {item.isAvailable ? "Available" : "Hidden"}
                    </span>
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() => handleToggle(item.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-body text-sm">
                Name *
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                placeholder="e.g. Caesar Salad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="font-body text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price" className="font-body text-sm">
                  Price ($) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  required
                  placeholder="9.99"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="font-body text-sm">
                  Category *
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="font-body text-sm">
                Image URL
              </Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, imageUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="ember-gradient text-white border-0"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">
              Delete Menu Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This action cannot be undone. The item will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && handleDelete(deleteId)}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
