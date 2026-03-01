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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Loader2,
  Pencil,
  Plus,
  Scale,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Plan, SubscriptionPlan } from "../backend.d";
import {
  useAllPlans,
  useCreatePlan,
  useDeletePlan,
  usePlanEnrollmentCounts,
  useUpdatePlan,
} from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return `₹${price.toFixed(0)}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PlanTypeBadge({ planType }: { planType: SubscriptionPlan }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-body text-xs font-semibold",
        planType === SubscriptionPlan.weekly
          ? "border-primary/40 text-primary bg-primary/5"
          : "border-muted-foreground/40 text-muted-foreground bg-secondary",
      )}
    >
      {planType === SubscriptionPlan.weekly
        ? "Weekly · 6 bowls"
        : "Monthly · 24 bowls"}
    </Badge>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-body font-semibold border",
        isActive
          ? "bg-[oklch(0.62_0.19_145/0.15)] text-[oklch(0.50_0.19_145)] border-[oklch(0.62_0.19_145/0.4)]"
          : "bg-muted text-muted-foreground border-border",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  name: "",
  planType: SubscriptionPlan.weekly as SubscriptionPlan,
  price250gm: "",
  price350gm: "",
  price500gm: "",
  isActive: true,
};

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan?: Plan | null;
}

function PlanDialog({ open, onOpenChange, editingPlan }: PlanDialogProps) {
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const isEdit = !!editingPlan;

  const [form, setForm] = useState(() =>
    editingPlan
      ? {
          name: editingPlan.name,
          planType: editingPlan.planType,
          price250gm: String(editingPlan.price250gm),
          price350gm: String(editingPlan.price350gm),
          price500gm: String(editingPlan.price500gm),
          isActive: editingPlan.isActive,
        }
      : { ...DEFAULT_FORM },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next)
      setForm(
        editingPlan
          ? {
              name: editingPlan.name,
              planType: editingPlan.planType,
              price250gm: String(editingPlan.price250gm),
              price350gm: String(editingPlan.price350gm),
              price500gm: String(editingPlan.price500gm),
              isActive: editingPlan.isActive,
            }
          : { ...DEFAULT_FORM },
      );
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    const p250 = Number.parseFloat(form.price250gm);
    const p350 = Number.parseFloat(form.price350gm);
    const p500 = Number.parseFloat(form.price500gm);
    if (
      Number.isNaN(p250) ||
      p250 < 0 ||
      Number.isNaN(p350) ||
      p350 < 0 ||
      Number.isNaN(p500) ||
      p500 < 0
    ) {
      toast.error("Please enter valid prices for all bowl sizes");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && editingPlan) {
        await updatePlan.mutateAsync({
          id: editingPlan.id,
          name: form.name.trim(),
          planType: form.planType,
          price250gm: p250,
          price350gm: p350,
          price500gm: p500,
          isActive: form.isActive,
        });
        toast.success("Plan updated");
      } else {
        await createPlan.mutateAsync({
          name: form.name.trim(),
          planType: form.planType,
          price250gm: p250,
          price350gm: p350,
          price500gm: p500,
        });
        toast.success("Plan created");
      }
      handleOpenChange(false);
    } catch {
      toast.error(isEdit ? "Failed to update plan" : "Failed to create plan");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? "Edit Plan" : "Add Plan"}
          </DialogTitle>
          <DialogDescription className="font-body text-sm">
            {isEdit
              ? "Update the plan details below."
              : "Fill in details to create a new subscription plan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Plan Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="plan-name"
              className="font-body text-sm font-medium"
            >
              Plan Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="plan-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="font-body"
              placeholder="e.g. Wellness Weekly"
            />
          </div>

          {/* Plan Type */}
          <div className="space-y-1.5">
            <Label className="font-body text-sm font-medium">Plan Type</Label>
            <Select
              value={form.planType}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, planType: v as SubscriptionPlan }))
              }
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value={SubscriptionPlan.weekly}
                  className="font-body"
                >
                  Weekly — 6 bowls / week
                </SelectItem>
                <SelectItem
                  value={SubscriptionPlan.monthly}
                  className="font-body"
                >
                  Monthly — 24 bowls / month
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prices */}
          <div className="space-y-2">
            <Label className="font-body text-sm font-medium">
              Bowl Pricing <span className="text-destructive">*</span>
            </Label>
            <div className="rounded-md border border-border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-2 bg-muted/50 border-b border-border">
                <span className="font-body text-xs font-semibold text-muted-foreground px-3 py-2">
                  Bowl Size
                </span>
                <span className="font-body text-xs font-semibold text-muted-foreground px-3 py-2 border-l border-border">
                  Plan Price (₹)
                </span>
              </div>
              {/* Row: 250gm */}
              <div className="grid grid-cols-2 items-center border-b border-border">
                <span className="font-body text-sm text-foreground px-3 py-2">
                  250gm
                </span>
                <div className="px-2 py-1.5 border-l border-border">
                  <Input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.price250gm}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price250gm: e.target.value }))
                    }
                    className="font-body h-8 border-0 shadow-none focus-visible:ring-0 p-0 px-1"
                    placeholder="e.g. 150"
                  />
                </div>
              </div>
              {/* Row: 350gm */}
              <div className="grid grid-cols-2 items-center border-b border-border">
                <span className="font-body text-sm text-foreground px-3 py-2">
                  350gm
                </span>
                <div className="px-2 py-1.5 border-l border-border">
                  <Input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.price350gm}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price350gm: e.target.value }))
                    }
                    className="font-body h-8 border-0 shadow-none focus-visible:ring-0 p-0 px-1"
                    placeholder="e.g. 200"
                  />
                </div>
              </div>
              {/* Row: 500gm */}
              <div className="grid grid-cols-2 items-center">
                <span className="font-body text-sm text-foreground px-3 py-2">
                  500gm
                </span>
                <div className="px-2 py-1.5 border-l border-border">
                  <Input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.price500gm}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price500gm: e.target.value }))
                    }
                    className="font-body h-8 border-0 shadow-none focus-visible:ring-0 p-0 px-1"
                    placeholder="e.g. 280"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active toggle — only in edit mode */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-body text-sm font-medium">Active</p>
                <p className="font-body text-xs text-muted-foreground">
                  Inactive plans won't be available for new subscriptions
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
            </div>
          )}

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
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

interface DeletePlanDialogProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DeletePlanDialog({ plan, open, onOpenChange }: DeletePlanDialogProps) {
  const deletePlan = useDeletePlan();

  async function handleDelete() {
    try {
      await deletePlan.mutateAsync(plan.id);
      toast.success(`Plan "${plan.name}" deleted`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete plan");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl">
            Delete Plan?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-body">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">"{plan.name}"</strong>? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
            onClick={handleDelete}
          >
            {deletePlan.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : null}
            Delete Plan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan;
  enrolledCount: number;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

function PlanCard({ plan, enrolledCount, onEdit, onDelete }: PlanCardProps) {
  return (
    <Card
      className={cn(
        "kitchen-card animate-slide-up transition-all",
        !plan.isActive && "opacity-60",
      )}
    >
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold text-foreground truncate">
              {plan.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <PlanTypeBadge planType={plan.planType} />
              <ActiveBadge isActive={plan.isActive} />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Edit plan"
              onClick={() => onEdit(plan)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete plan"
              onClick={() => onDelete(plan)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Bowl size pricing */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "250gm", price: plan.price250gm },
            { label: "350gm", price: plan.price350gm },
            { label: "500gm", price: plan.price500gm },
          ].map(({ label, price }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-md bg-accent/30 border border-border px-2 py-2.5 gap-0.5"
            >
              <div className="flex items-center gap-1 text-muted-foreground">
                <Scale className="w-3 h-3" />
                <span className="font-body text-xs">{label}</span>
              </div>
              <span className="font-display text-base font-bold text-foreground">
                {formatPrice(price)}
              </span>
            </div>
          ))}
        </div>

        {/* Members enrolled */}
        <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span className="font-body text-sm text-foreground">
            <span className="font-bold text-primary">{enrolledCount}</span>{" "}
            member{enrolledCount !== 1 ? "s" : ""} enrolled
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Plans() {
  const { data: plans, isLoading: plansLoading } = useAllPlans();
  const { data: enrollments, isLoading: enrollmentsLoading } =
    usePlanEnrollmentCounts();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  const isLoading = plansLoading || enrollmentsLoading;

  function getEnrolledCount(planId: bigint): number {
    if (!enrollments) return 0;
    const entry = enrollments.find((e) => e.planId === planId);
    return entry ? Number(entry.enrolledCount) : 0;
  }

  // Summary stats
  const totalPlans = plans?.length ?? 0;
  const activePlans = plans?.filter((p) => p.isActive).length ?? 0;
  const totalEnrolled =
    enrollments?.reduce((sum, e) => sum + Number(e.enrolledCount), 0) ?? 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Plans
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Manage your subscription plans and bowl size pricing
          </p>
        </div>
        <Button
          className="ember-gradient text-white border-0 font-body shrink-0 gap-1.5"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="kitchen-card animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Total Plans
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {totalPlans}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card animate-slide-up delay-100">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Active Plans
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {activePlans}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-[oklch(0.62_0.19_145/0.15)] flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-[oklch(0.50_0.19_145)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kitchen-card animate-slide-up delay-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                  Total Enrolled
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="font-display text-3xl font-bold text-foreground">
                    {totalEnrolled}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div>
        <Card className="kitchen-card animate-slide-up delay-200">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-xl">All Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {["p1", "p2", "p3"].map((k) => (
                  <Skeleton key={k} className="h-52 w-full rounded-xl" />
                ))}
              </div>
            ) : !plans || plans.length === 0 ? (
              <div className="py-16 text-center">
                <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-foreground">
                  No plans yet
                </h3>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Click "Add Plan" above to create your first subscription plan
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <PlanCard
                    key={String(plan.id)}
                    plan={plan}
                    enrolledCount={getEnrolledCount(plan.id)}
                    onEdit={setEditingPlan}
                    onDelete={setDeletingPlan}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <PlanDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {/* Edit Dialog */}
      {editingPlan && (
        <PlanDialog
          key={String(editingPlan.id)}
          open={!!editingPlan}
          onOpenChange={(open) => {
            if (!open) setEditingPlan(null);
          }}
          editingPlan={editingPlan}
        />
      )}

      {/* Delete Dialog */}
      {deletingPlan && (
        <DeletePlanDialog
          plan={deletingPlan}
          open={!!deletingPlan}
          onOpenChange={(open) => {
            if (!open) setDeletingPlan(null);
          }}
        />
      )}
    </div>
  );
}
