import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  PauseCircle,
  PlayCircle,
  XCircle,
  CalendarDays,
  Loader2,
  AlertTriangle,
  Pencil,
  ClockAlert,
  Ban,
  Plus,
} from "lucide-react";
import {
  useAllSubscriptions,
  useUpdateSubscriptionStatus,
  useCheckAndExpireSubscriptions,
  useExpiringSubscriptions,
  useUpdateSubscription,
  useCreateSubscription,
} from "../hooks/useQueries";
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BowlSize,
  PaymentStatus,
  Subscription,
} from "../backend.d";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ns: bigint) {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price: number) {
  return `₹${price.toFixed(2)}`;
}

function isExpiringSoon(endDate: bigint): boolean {
  const nowMs = Date.now();
  const endMs = Number(endDate / 1_000_000n);
  const diffDays = (endMs - nowMs) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 2;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const config: Record<
    SubscriptionStatus,
    { label: string; className: string }
  > = {
    [SubscriptionStatus.active]: {
      label: "Active",
      className:
        "bg-[oklch(0.62_0.19_145/0.15)] text-[oklch(0.50_0.19_145)] border-[oklch(0.62_0.19_145/0.4)]",
    },
    [SubscriptionStatus.paused]: {
      label: "Paused",
      className:
        "bg-[oklch(0.82_0.19_85/0.15)] text-[oklch(0.60_0.18_85)] border-[oklch(0.82_0.19_85/0.4)]",
    },
    [SubscriptionStatus.cancelled]: {
      label: "Cancelled",
      className:
        "bg-[oklch(0.55_0.22_25/0.15)] text-[oklch(0.55_0.22_25)] border-[oklch(0.55_0.22_25/0.4)]",
    },
    [SubscriptionStatus.expired]: {
      label: "Expired",
      className:
        "bg-muted text-muted-foreground border-border",
    },
  };
  const c = config[status] ?? config[SubscriptionStatus.cancelled];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-body font-semibold border",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-body text-xs",
        plan === SubscriptionPlan.weekly
          ? "border-primary/40 text-primary bg-primary/5"
          : "border-muted-foreground/40 text-muted-foreground bg-secondary"
      )}
    >
      {plan === SubscriptionPlan.weekly ? "Weekly · 6 bowls" : "Monthly · 24 bowls"}
    </Badge>
  );
}

function BowlSizeBadge({ size }: { size: BowlSize }) {
  const labels: Record<BowlSize, string> = {
    [BowlSize.small]: "S",
    [BowlSize.medium]: "M",
    [BowlSize.large]: "L",
  };
  const fullLabels: Record<BowlSize, string> = {
    [BowlSize.small]: "Small",
    [BowlSize.medium]: "Medium",
    [BowlSize.large]: "Large",
  };
  return (
    <Badge
      variant="secondary"
      className="font-body text-xs font-semibold"
      title={fullLabels[size]}
    >
      {labels[size]}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { label: string; className: string }> = {
    [PaymentStatus.paid]: {
      label: "Paid",
      className:
        "bg-[oklch(0.62_0.19_145/0.15)] text-[oklch(0.50_0.19_145)] border-[oklch(0.62_0.19_145/0.4)]",
    },
    [PaymentStatus.pending]: {
      label: "Pending",
      className:
        "bg-[oklch(0.82_0.19_85/0.15)] text-[oklch(0.60_0.17_85)] border-[oklch(0.82_0.19_85/0.4)]",
    },
    [PaymentStatus.overdue]: {
      label: "Overdue",
      className:
        "bg-[oklch(0.55_0.22_25/0.15)] text-[oklch(0.55_0.22_25)] border-[oklch(0.55_0.22_25/0.4)]",
    },
  };
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-body font-semibold border",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}

// ─── Add Subscription Dialog ──────────────────────────────────────────────────

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_ADD_FORM = {
  customerName: "",
  customerPhone: "",
  plan: SubscriptionPlan.weekly as SubscriptionPlan,
  bowlSize: BowlSize.medium as BowlSize,
  price: "",
  paymentStatus: PaymentStatus.pending as PaymentStatus,
};

function AddSubscriptionDialog({ open, onOpenChange }: AddSubscriptionDialogProps) {
  const createSub = useCreateSubscription();
  const updateSub = useUpdateSubscription();
  const [form, setForm] = useState({ ...DEFAULT_ADD_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setForm({ ...DEFAULT_ADD_FORM });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.customerPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const newSub = await createSub.mutateAsync({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        plan: form.plan,
        bowlSize: form.bowlSize,
        price: parsedPrice,
      });

      // If payment status is not pending, update it
      if (form.paymentStatus !== PaymentStatus.pending) {
        await updateSub.mutateAsync({
          id: newSub.id,
          bowlSize: form.bowlSize,
          price: parsedPrice,
          paymentStatus: form.paymentStatus,
        });
      }

      toast.success(`Subscription added for ${form.customerName.trim()}`);
      handleOpenChange(false);
    } catch {
      toast.error("Failed to add subscription");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add Subscription
          </DialogTitle>
          <DialogDescription className="font-body text-sm">
            Enter the customer's details to create a new subscription.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Customer Name */}
          <div className="space-y-1.5">
            <Label htmlFor="add-cust-name" className="font-body text-sm font-medium">
              Customer Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="add-cust-name"
              type="text"
              required
              value={form.customerName}
              onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
              className="font-body"
              placeholder="e.g. Priya Sharma"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="add-cust-phone" className="font-body text-sm font-medium">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="add-cust-phone"
              type="tel"
              required
              value={form.customerPhone}
              onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
              className="font-body"
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          {/* Plan */}
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Plan</Label>
            <Select
              value={form.plan}
              onValueChange={(v) => setForm((p) => ({ ...p, plan: v as SubscriptionPlan }))}
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SubscriptionPlan.weekly} className="font-body">
                  Weekly — 6 bowls / week
                </SelectItem>
                <SelectItem value={SubscriptionPlan.monthly} className="font-body">
                  Monthly — 24 bowls / month
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bowl Size */}
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Bowl Size</Label>
            <Select
              value={form.bowlSize}
              onValueChange={(v) => setForm((p) => ({ ...p, bowlSize: v as BowlSize }))}
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BowlSize.small} className="font-body">Small</SelectItem>
                <SelectItem value={BowlSize.medium} className="font-body">Medium</SelectItem>
                <SelectItem value={BowlSize.large} className="font-body">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="add-price" className="font-body text-sm font-medium">
              Price (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="add-price"
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              className="font-body"
              placeholder="e.g. 700"
            />
          </div>

          {/* Payment Status */}
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Payment Status</Label>
            <Select
              value={form.paymentStatus}
              onValueChange={(v) => setForm((p) => ({ ...p, paymentStatus: v as PaymentStatus }))}
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentStatus.pending} className="font-body">Pending</SelectItem>
                <SelectItem value={PaymentStatus.paid} className="font-body">Paid</SelectItem>
                <SelectItem value={PaymentStatus.overdue} className="font-body">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="font-body"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="ember-gradient text-white border-0 font-body"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Adding…
                </>
              ) : (
                "Add Subscription"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  sub: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditDialog({ sub, open, onOpenChange }: EditDialogProps) {
  const updateSub = useUpdateSubscription();
  const [bowlSize, setBowlSize] = useState<BowlSize>(sub.bowlSize);
  const [price, setPrice] = useState(String(sub.price));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    sub.paymentStatus
  );

  // Reset when sub changes
  useEffect(() => {
    setBowlSize(sub.bowlSize);
    setPrice(String(sub.price));
    setPaymentStatus(sub.paymentStatus);
  }, [sub]);

  async function handleSave() {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    try {
      await updateSub.mutateAsync({
        id: sub.id,
        bowlSize,
        price: parsedPrice,
        paymentStatus,
      });
      toast.success("Subscription updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update subscription");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Edit Subscription
          </DialogTitle>
          <DialogDescription className="font-body text-sm">
            Update details for{" "}
            <strong className="text-foreground">{sub.customerName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Bowl Size</Label>
            <Select
              value={bowlSize}
              onValueChange={(v) => setBowlSize(v as BowlSize)}
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BowlSize.small} className="font-body">
                  Small
                </SelectItem>
                <SelectItem value={BowlSize.medium} className="font-body">
                  Medium
                </SelectItem>
                <SelectItem value={BowlSize.large} className="font-body">
                  Large
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">
              Price (₹)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-body"
              placeholder="e.g. 700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">
              Payment Status
            </Label>
            <Select
              value={paymentStatus}
              onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentStatus.pending} className="font-body">
                  Pending
                </SelectItem>
                <SelectItem value={PaymentStatus.paid} className="font-body">
                  Paid
                </SelectItem>
                <SelectItem value={PaymentStatus.overdue} className="font-body">
                  Overdue
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="font-body"
            onClick={() => onOpenChange(false)}
            disabled={updateSub.isPending}
          >
            Cancel
          </Button>
          <Button
            className="ember-gradient text-white border-0 font-body"
            onClick={handleSave}
            disabled={updateSub.isPending}
          >
            {updateSub.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterTab = "all" | "active" | "paused" | "expired" | "cancelled";

export default function Subscriptions() {
  const { data: subscriptions, isLoading } = useAllSubscriptions();
  const { data: expiringSubs = [] } = useExpiringSubscriptions();
  const updateStatus = useUpdateSubscriptionStatus();
  const checkExpire = useCheckAndExpireSubscriptions();

  const [pendingId, setPendingId] = useState<bigint | null>(null);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // On mount: check and expire subscriptions automatically
  const checkExpireMutate = checkExpire.mutate;
  useEffect(() => {
    checkExpireMutate();
  }, [checkExpireMutate]);

  const active =
    subscriptions?.filter((s) => s.status === SubscriptionStatus.active) ?? [];
  const paused =
    subscriptions?.filter((s) => s.status === SubscriptionStatus.paused) ?? [];
  const cancelled =
    subscriptions?.filter(
      (s) => s.status === SubscriptionStatus.cancelled
    ) ?? [];
  const expired =
    subscriptions?.filter((s) => s.status === SubscriptionStatus.expired) ?? [];

  const filteredSubs = subscriptions?.filter((s) => {
    if (filterTab === "all") return true;
    if (filterTab === "active") return s.status === SubscriptionStatus.active;
    if (filterTab === "paused") return s.status === SubscriptionStatus.paused;
    if (filterTab === "expired") return s.status === SubscriptionStatus.expired;
    if (filterTab === "cancelled")
      return s.status === SubscriptionStatus.cancelled;
    return true;
  }) ?? [];

  async function handleStatus(id: bigint, status: SubscriptionStatus) {
    setPendingId(id);
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(
        status === SubscriptionStatus.active
          ? "Subscription resumed"
          : status === SubscriptionStatus.paused
          ? "Subscription paused"
          : "Subscription cancelled"
      );
    } catch {
      toast.error("Failed to update subscription status");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Subscriptions
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Manage your recurring salad bowl subscriptions
          </p>
        </div>
        <Button
          className="ember-gradient text-white border-0 font-body shrink-0 gap-1.5"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      {/* Expiry Alert Banner */}
      {expiringSubs.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-[oklch(0.82_0.19_85/0.5)] bg-[oklch(0.82_0.19_85/0.08)] px-4 py-3 animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-[oklch(0.62_0.18_85)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-sm text-[oklch(0.55_0.18_85)]">
              {expiringSubs.length} subscription
              {expiringSubs.length > 1 ? "s" : ""} expiring within 2 days
            </p>
            <ul className="mt-1 space-y-0.5">
              {expiringSubs.map((s) => (
                <li
                  key={String(s.id)}
                  className="font-body text-xs text-[oklch(0.55_0.16_85)]"
                >
                  <span className="font-medium">{s.customerName}</span> — ends{" "}
                  {formatDate(s.endDate)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Active */}
        <Card className="kitchen-card animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Active
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {active.length}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paused */}
        <Card className="kitchen-card animate-slide-up delay-100">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Paused
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {paused.length}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-[oklch(0.82_0.19_85/0.15)] flex items-center justify-center">
                <PauseCircle className="w-5 h-5 text-[oklch(0.62_0.18_85)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expired */}
        <Card className="kitchen-card animate-slide-up delay-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Expired
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-muted-foreground">
                    {expired.length}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                <ClockAlert className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card className="kitchen-card animate-slide-up delay-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Cancelled
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {cancelled.length}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-destructive/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card className="kitchen-card animate-slide-up delay-300">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="font-display text-xl">
              All Subscriptions
            </CardTitle>
            <div className="sm:ml-auto">
              <Tabs
                value={filterTab}
                onValueChange={(v) => setFilterTab(v as FilterTab)}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="font-body text-xs h-6 px-3">
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="font-body text-xs h-6 px-3"
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger
                    value="paused"
                    className="font-body text-xs h-6 px-3"
                  >
                    Paused
                  </TabsTrigger>
                  <TabsTrigger
                    value="expired"
                    className="font-body text-xs h-6 px-3"
                  >
                    Expired
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="font-body text-xs h-6 px-3"
                  >
                    Cancelled
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {["s1", "s2", "s3", "s4"].map((k) => (
                <Skeleton key={k} className="h-14 w-full" />
              ))}
            </div>
          ) : !filteredSubs || filteredSubs.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-foreground">
                {filterTab === "all"
                  ? "No subscriptions yet"
                  : `No ${filterTab} subscriptions`}
              </h3>
              <p className="font-body text-sm text-muted-foreground mt-1">
                {filterTab === "all"
                  ? "Click \"Add Subscription\" above to add your first subscriber"
                  : "Try selecting a different filter"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                      Customer
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                      Plan
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
                      Start Date
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                      End Date
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                      Bowl
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
                      Price
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                      Payment
                    </TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-widest text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((sub) => {
                    const isProcessing = pendingId === sub.id;
                    const isExpired = sub.status === SubscriptionStatus.expired;
                    const isCancelled =
                      sub.status === SubscriptionStatus.cancelled;
                    const expiringSoon = isExpiringSoon(sub.endDate);
                    const isMuted = isExpired || isCancelled;

                    return (
                      <TableRow
                        key={String(sub.id)}
                        className={cn(
                          "hover:bg-accent/20 transition-colors",
                          isMuted && "opacity-50"
                        )}
                      >
                        {/* Customer */}
                        <TableCell>
                          <div className="font-body font-medium text-foreground text-sm">
                            {sub.customerName}
                          </div>
                          <div className="font-body text-xs text-muted-foreground">
                            {sub.customerPhone}
                          </div>
                        </TableCell>

                        {/* Plan */}
                        <TableCell>
                          <PlanBadge plan={sub.plan} />
                        </TableCell>

                        {/* Start Date */}
                        <TableCell className="font-body text-sm text-muted-foreground hidden sm:table-cell">
                          {formatDate(sub.startDate)}
                        </TableCell>

                        {/* End Date */}
                        <TableCell className="hidden md:table-cell">
                          <span
                            className={cn(
                              "font-body text-sm",
                              isExpired
                                ? "text-muted-foreground line-through"
                                : expiringSoon
                                ? "text-[oklch(0.58_0.18_55)] font-semibold"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatDate(sub.endDate)}
                          </span>
                          {expiringSoon && !isExpired && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[oklch(0.58_0.18_55)]">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="font-body text-xs font-medium">
                                Soon
                              </span>
                            </span>
                          )}
                        </TableCell>

                        {/* Bowl Size */}
                        <TableCell>
                          <BowlSizeBadge size={sub.bowlSize} />
                        </TableCell>

                        {/* Price */}
                        <TableCell className="font-body text-sm font-semibold text-foreground hidden sm:table-cell">
                          {formatPrice(sub.price)}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={sub.status} />
                        </TableCell>

                        {/* Payment */}
                        <TableCell className="hidden md:table-cell">
                          <PaymentBadge status={sub.paymentStatus} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="Edit"
                              onClick={() => setEditingSub(sub)}
                              disabled={isProcessing}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            {/* Pause / Resume */}
                            {sub.status === SubscriptionStatus.active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 font-body text-xs text-muted-foreground hover:text-foreground"
                                disabled={isProcessing}
                                onClick={() =>
                                  handleStatus(
                                    sub.id,
                                    SubscriptionStatus.paused
                                  )
                                }
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <PauseCircle className="w-3.5 h-3.5 mr-1" />
                                )}
                                Pause
                              </Button>
                            )}
                            {sub.status === SubscriptionStatus.paused && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 font-body text-xs text-primary hover:text-primary"
                                disabled={isProcessing}
                                onClick={() =>
                                  handleStatus(
                                    sub.id,
                                    SubscriptionStatus.active
                                  )
                                }
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <PlayCircle className="w-3.5 h-3.5 mr-1" />
                                )}
                                Resume
                              </Button>
                            )}

                            {/* Cancel (only if active or paused) */}
                            {(sub.status === SubscriptionStatus.active ||
                              sub.status === SubscriptionStatus.paused) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2.5 font-body text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={isProcessing}
                                  >
                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-display text-xl">
                                      Cancel Subscription?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="font-body">
                                      This will cancel{" "}
                                      <strong>{sub.customerName}</strong>'s{" "}
                                      {sub.plan === SubscriptionPlan.weekly
                                        ? "weekly"
                                        : "monthly"}{" "}
                                      subscription. This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="font-body">
                                      Keep Subscription
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                                      onClick={() =>
                                        handleStatus(
                                          sub.id,
                                          SubscriptionStatus.cancelled
                                        )
                                      }
                                    >
                                      Yes, Cancel
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
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

      {/* Add Subscription Dialog */}
      <AddSubscriptionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* Edit Dialog */}
      {editingSub && (
        <EditDialog
          sub={editingSub}
          open={!!editingSub}
          onOpenChange={(open) => {
            if (!open) setEditingSub(null);
          }}
        />
      )}
    </div>
  );
}
