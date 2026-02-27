import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  MapPin,
  Star,
  Search,
} from "lucide-react";
import {
  useAllCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "../hooks/useQueries";
import { Customer } from "../backend.d";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Customer Form ─────────────────────────────────────────────────────────────

interface CustomerFormData {
  name: string;
  mobileNo: string;
  preferences: string;
  address: string;
}

const DEFAULT_FORM: CustomerFormData = {
  name: "",
  mobileNo: "",
  preferences: "",
  address: "",
};

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCustomer?: Customer | null;
}

function CustomerDialog({ open, onOpenChange, editingCustomer }: CustomerDialogProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const [form, setForm] = useState<CustomerFormData>(() =>
    editingCustomer
      ? {
          name: editingCustomer.name,
          mobileNo: editingCustomer.mobileNo,
          preferences: editingCustomer.preferences,
          address: editingCustomer.address,
        }
      : { ...DEFAULT_FORM }
  );

  const isEditing = !!editingCustomer;
  const isPending = createCustomer.isPending || updateCustomer.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setForm({ ...DEFAULT_FORM });
    onOpenChange(nextOpen);
  }

  // When dialog re-opens with a different customer to edit, sync form
  function handleFormChange(field: keyof CustomerFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.mobileNo.trim()) {
      toast.error("Mobile number is required");
      return;
    }

    try {
      if (isEditing && editingCustomer) {
        await updateCustomer.mutateAsync({
          id: editingCustomer.id,
          name: form.name.trim(),
          mobileNo: form.mobileNo.trim(),
          preferences: form.preferences.trim(),
          address: form.address.trim(),
        });
        toast.success(`${form.name.trim()} updated successfully`);
      } else {
        await createCustomer.mutateAsync({
          name: form.name.trim(),
          mobileNo: form.mobileNo.trim(),
          preferences: form.preferences.trim(),
          address: form.address.trim(),
        });
        toast.success(`${form.name.trim()} added successfully`);
      }
      handleOpenChange(false);
    } catch {
      toast.error(isEditing ? "Failed to update customer" : "Failed to add customer");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
          <DialogDescription className="font-body text-sm">
            {isEditing
              ? `Update details for ${editingCustomer?.name}`
              : "Fill in the customer's details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cust-name" className="font-body text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cust-name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              className="font-body"
              placeholder="e.g. Priya Sharma"
            />
          </div>

          {/* Mobile No */}
          <div className="space-y-1.5">
            <Label htmlFor="cust-mobile" className="font-body text-sm font-medium">
              Mobile Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cust-mobile"
              type="tel"
              required
              autoComplete="tel"
              value={form.mobileNo}
              onChange={(e) => handleFormChange("mobileNo", e.target.value)}
              className="font-body"
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          {/* Preferences */}
          <div className="space-y-1.5">
            <Label htmlFor="cust-prefs" className="font-body text-sm font-medium">
              Preferences
              <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="cust-prefs"
              rows={3}
              value={form.preferences}
              onChange={(e) => handleFormChange("preferences", e.target.value)}
              className="font-body resize-none"
              placeholder="e.g. No onions, extra dressing, vegan only…"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="cust-addr" className="font-body text-sm font-medium">
              Address
              <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="cust-addr"
              rows={3}
              value={form.address}
              onChange={(e) => handleFormChange("address", e.target.value)}
              className="font-body resize-none"
              placeholder="e.g. 42, Green Park, New Delhi 110016"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="font-body"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="ember-gradient text-white border-0 font-body"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  {isEditing ? "Saving…" : "Adding…"}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Customer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Customers() {
  const { data: customers, isLoading } = useAllCustomers();
  const deleteCustomer = useDeleteCustomer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const filtered = (customers ?? []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobileNo.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.preferences.toLowerCase().includes(q)
    );
  });

  function handleAdd() {
    setEditingCustomer(null);
    setDialogOpen(true);
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setDialogOpen(true);
  }

  async function handleDelete(id: bigint, name: string) {
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success(`${name} removed`);
    } catch {
      toast.error("Failed to delete customer");
    }
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingCustomer(null);
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Customers
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Manage your customer profiles, preferences, and addresses
          </p>
        </div>
        <Button
          className="ember-gradient text-white border-0 font-body shrink-0 gap-1.5"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="kitchen-card animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Total Customers
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {customers?.length ?? 0}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card animate-slide-up delay-100">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  With Preferences
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {customers?.filter((c) => c.preferences.trim()).length ?? 0}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-[oklch(0.82_0.19_85/0.15)] flex items-center justify-center">
                <Star className="w-5 h-5 text-[oklch(0.62_0.18_85)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card animate-slide-up delay-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  With Address
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {customers?.filter((c) => c.address.trim()).length ?? 0}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-[oklch(0.62_0.19_145/0.1)] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="kitchen-card animate-slide-up delay-300">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="font-display text-xl">All Customers</CardTitle>
            {/* Search */}
            <div className="sm:ml-auto relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search customers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 font-body h-8 w-full sm:w-56"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {["r1", "r2", "r3", "r4"].map((k) => (
                <Skeleton key={k} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-foreground">
                {search.trim()
                  ? "No customers match your search"
                  : "No customers yet"}
              </h3>
              <p className="font-body text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                {search.trim()
                  ? "Try a different name, number, or address"
                  : 'Click "Add Customer" above to save your first customer'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                      Mobile No
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                      Preferences
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                      Address
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => (
                    <TableRow
                      key={String(customer.id)}
                      className="hover:bg-accent/20 transition-colors group"
                    >
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="font-display text-xs font-bold text-primary">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-body font-medium text-foreground text-sm">
                            {customer.name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Mobile */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{customer.mobileNo || "—"}</span>
                        </div>
                      </TableCell>

                      {/* Preferences */}
                      <TableCell className="hidden md:table-cell max-w-[200px]">
                        {customer.preferences.trim() ? (
                          <p
                            className={cn(
                              "font-body text-sm text-muted-foreground truncate",
                            )}
                            title={customer.preferences}
                          >
                            {customer.preferences}
                          </p>
                        ) : (
                          <span className="font-body text-xs text-muted-foreground/50 italic">
                            None
                          </span>
                        )}
                      </TableCell>

                      {/* Address */}
                      <TableCell className="hidden lg:table-cell max-w-[220px]">
                        {customer.address.trim() ? (
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <p
                              className="font-body text-sm text-muted-foreground truncate"
                              title={customer.address}
                            >
                              {customer.address}
                            </p>
                          </div>
                        ) : (
                          <span className="font-body text-xs text-muted-foreground/50 italic">
                            Not set
                          </span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit customer"
                            onClick={() => handleEdit(customer)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete customer"
                                disabled={deleteCustomer.isPending}
                              >
                                {deleteCustomer.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-display text-xl">
                                  Delete Customer?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="font-body">
                                  This will permanently remove{" "}
                                  <strong className="text-foreground">
                                    {customer.name}
                                  </strong>{" "}
                                  from your customer list. This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-body">
                                  Keep Customer
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                                  onClick={() =>
                                    handleDelete(customer.id, customer.name)
                                  }
                                >
                                  Yes, Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <CustomerDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        editingCustomer={editingCustomer}
      />
    </div>
  );
}
