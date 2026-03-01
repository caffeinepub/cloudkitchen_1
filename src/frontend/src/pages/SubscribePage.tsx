import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Leaf,
  Loader2,
  Salad,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BowlSize, SubscriptionPlan } from "../backend.d";
import { useCreateSubscription } from "../hooks/useQueries";

// ─── Price table ──────────────────────────────────────────────────────────────
const PRICES: Record<SubscriptionPlan, Record<BowlSize, number>> = {
  [SubscriptionPlan.weekly]: {
    [BowlSize.small]: 500,
    [BowlSize.medium]: 700,
    [BowlSize.large]: 900,
  },
  [SubscriptionPlan.monthly]: {
    [BowlSize.small]: 1800,
    [BowlSize.medium]: 2400,
    [BowlSize.large]: 3200,
  },
};

// ─── Bowl size descriptions ───────────────────────────────────────────────────
const BOWL_INFO: Record<BowlSize, { label: string; desc: string }> = {
  [BowlSize.small]: { label: "Small", desc: "~300ml · Light & refreshing" },
  [BowlSize.medium]: { label: "Medium", desc: "~500ml · Perfect balance" },
  [BowlSize.large]: { label: "Large", desc: "~700ml · Hearty & filling" },
};

// ─── Plan Card ────────────────────────────────────────────────────────────────
interface PlanCardProps {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const isWeekly = plan === SubscriptionPlan.weekly;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border-2 p-5 transition-all duration-200 group relative overflow-hidden",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/40 hover:shadow-sm",
      )}
    >
      {isWeekly && (
        <span className="absolute top-3 right-3">
          <Badge className="bg-primary/10 text-primary border-primary/30 font-body text-xs">
            Popular
          </Badge>
        </span>
      )}
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
          selected ? "ember-gradient" : "bg-secondary",
        )}
      >
        {isWeekly ? (
          <Clock
            className={cn("w-5 h-5", selected ? "text-white" : "text-primary")}
          />
        ) : (
          <Calendar
            className={cn("w-5 h-5", selected ? "text-white" : "text-primary")}
          />
        )}
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-1">
        {isWeekly ? "Weekly Plan" : "Monthly Plan"}
      </h3>
      <p className="font-body text-sm text-muted-foreground mb-3">
        {isWeekly
          ? "6 fresh salad bowls delivered every week"
          : "24 fresh salad bowls delivered every month"}
      </p>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
            selected ? "border-primary bg-primary" : "border-border",
          )}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <span
          className={cn(
            "font-body text-sm font-medium",
            selected ? "text-primary" : "text-muted-foreground",
          )}
        >
          {selected ? "Selected" : "Select this plan"}
        </span>
        {!selected && (
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
        )}
      </div>
    </button>
  );
}

// ─── Bowl Size Selector ───────────────────────────────────────────────────────
interface BowlSizeSelectorProps {
  plan: SubscriptionPlan;
  selected: BowlSize;
  onSelect: (size: BowlSize) => void;
}

function BowlSizeSelector({ plan, selected, onSelect }: BowlSizeSelectorProps) {
  const sizes: BowlSize[] = [BowlSize.small, BowlSize.medium, BowlSize.large];
  return (
    <div className="grid grid-cols-3 gap-3">
      {sizes.map((size) => {
        const info = BOWL_INFO[size];
        const price = PRICES[plan][size];
        const isSelected = selected === size;
        return (
          <button
            key={size}
            type="button"
            onClick={() => onSelect(size)}
            className={cn(
              "text-left rounded-xl border-2 p-4 transition-all duration-200",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30 hover:shadow-sm",
            )}
          >
            <div className="font-display text-xl font-bold text-foreground mb-0.5">
              {info.label}
            </div>
            <div className="font-body text-xs text-muted-foreground mb-2 leading-relaxed">
              {info.desc}
            </div>
            <div
              className={cn(
                "font-display text-lg font-bold",
                isSelected ? "text-primary" : "text-foreground",
              )}
            >
              ₹{price}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    SubscriptionPlan.weekly,
  );
  const [selectedBowlSize, setSelectedBowlSize] = useState<BowlSize>(
    BowlSize.medium,
  );
  const [form, setForm] = useState({ name: "", phone: "" });
  const [subscribed, setSubscribed] = useState(false);

  const createSubscription = useCreateSubscription();

  const price = PRICES[selectedPlan][selectedBowlSize];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please fill in your name and phone number");
      return;
    }
    try {
      await createSubscription.mutateAsync({
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        plan: selectedPlan,
        bowlSize: selectedBowlSize,
        price,
      });
      setSubscribed(true);
    } catch {
      toast.error("Couldn't create subscription. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-md ember-gradient flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">
            SALAD<span className="text-primary">STATION</span>
          </span>
        </div>
      </header>

      <main className="flex-1">
        {subscribed ? (
          /* ── Success State ── */
          <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">
              You're Subscribed!
            </h1>
            <p className="font-body text-base text-muted-foreground mb-6 leading-relaxed">
              We'll be in touch to confirm your first delivery. Fresh salads are
              on their way to you{" "}
              {selectedPlan === SubscriptionPlan.weekly
                ? "every week"
                : "every month"}
              .
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-primary text-sm uppercase tracking-wider">
                  Your Plan
                </span>
              </div>
              <p className="font-body text-foreground font-medium">
                {form.name}
              </p>
              <p className="font-body text-muted-foreground text-sm">
                {form.phone}
              </p>
              <p className="font-body text-sm text-foreground mt-2 font-medium">
                {selectedPlan === SubscriptionPlan.weekly
                  ? "Weekly · 6 bowls/week"
                  : "Monthly · 24 bowls/month"}{" "}
                · {BOWL_INFO[selectedBowlSize].label} bowl
              </p>
              <p className="font-display text-xl font-bold text-primary mt-1">
                ₹{price}
              </p>
            </div>
            <Button
              variant="outline"
              className="font-body"
              onClick={() => {
                setSubscribed(false);
                setForm({ name: "", phone: "" });
              }}
            >
              Subscribe another person
            </Button>
          </div>
        ) : (
          <>
            {/* ── Hero ── */}
            <section className="bg-sidebar text-sidebar-foreground py-16 px-4">
              <div className="max-w-2xl mx-auto text-center animate-fade-in">
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary rounded-full px-4 py-1.5 mb-5">
                  <Salad className="w-4 h-4" />
                  <span className="font-body text-xs font-semibold uppercase tracking-widest">
                    Fresh Salad Subscriptions
                  </span>
                </div>
                <h1 className="font-display text-5xl md:text-6xl font-bold text-sidebar-foreground mb-4 leading-tight">
                  Subscribe to{" "}
                  <span className="text-primary">Fresh Salads</span>
                </h1>
                <p className="font-body text-sidebar-foreground/70 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                  Hand-crafted, nutrient-packed salad bowls delivered straight
                  to you. Choose your plan and never skip a healthy meal again.
                </p>
              </div>
            </section>

            {/* ── Form Section ── */}
            <section className="py-12 px-4">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Plan Cards */}
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                      Choose Your Plan
                    </h2>
                    <p className="font-body text-sm text-muted-foreground mb-5">
                      Select the frequency that works best for you
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <PlanCard
                        plan={SubscriptionPlan.weekly}
                        selected={selectedPlan === SubscriptionPlan.weekly}
                        onSelect={() =>
                          setSelectedPlan(SubscriptionPlan.weekly)
                        }
                      />
                      <PlanCard
                        plan={SubscriptionPlan.monthly}
                        selected={selectedPlan === SubscriptionPlan.monthly}
                        onSelect={() =>
                          setSelectedPlan(SubscriptionPlan.monthly)
                        }
                      />
                    </div>
                  </div>

                  {/* Bowl Size */}
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                      Choose Your Bowl Size
                    </h2>
                    <p className="font-body text-sm text-muted-foreground mb-5">
                      Prices shown per{" "}
                      {selectedPlan === SubscriptionPlan.weekly
                        ? "week (6 bowls)"
                        : "month (24 bowls)"}
                    </p>
                    <BowlSizeSelector
                      plan={selectedPlan}
                      selected={selectedBowlSize}
                      onSelect={setSelectedBowlSize}
                    />
                  </div>

                  {/* Details */}
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                      Your Details
                    </h2>
                    <p className="font-body text-sm text-muted-foreground mb-5">
                      We'll use these to confirm your first delivery
                    </p>
                    <Card className="kitchen-card">
                      <CardContent className="p-5 space-y-4">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="sub-name"
                            className="font-body text-sm font-medium"
                          >
                            Full Name *
                          </Label>
                          <Input
                            id="sub-name"
                            value={form.name}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, name: e.target.value }))
                            }
                            required
                            placeholder="e.g. Sarah Johnson"
                            className="font-body"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="sub-phone"
                            className="font-body text-sm font-medium"
                          >
                            Phone Number *
                          </Label>
                          <Input
                            id="sub-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, phone: e.target.value }))
                            }
                            required
                            placeholder="e.g. +91 98765 43210"
                            className="font-body"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary + Submit */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                    <p className="font-body text-sm text-muted-foreground mb-1">
                      You're signing up for
                    </p>
                    <p className="font-display text-xl font-bold text-foreground">
                      {selectedPlan === SubscriptionPlan.weekly
                        ? "Weekly Plan — 6 bowls every week"
                        : "Monthly Plan — 24 bowls every month"}
                    </p>
                    <p className="font-body text-sm text-muted-foreground mt-1">
                      {BOWL_INFO[selectedBowlSize].label} bowl ·{" "}
                      {BOWL_INFO[selectedBowlSize].desc}
                    </p>
                    <p className="font-display text-2xl font-bold text-primary mt-2">
                      ₹{price}
                      <span className="font-body text-sm text-muted-foreground font-normal ml-1">
                        /
                        {selectedPlan === SubscriptionPlan.weekly
                          ? "week"
                          : "month"}
                      </span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full ember-gradient text-white border-0 font-display text-base font-bold tracking-wider h-12"
                    disabled={createSubscription.isPending}
                  >
                    {createSubscription.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Subscribing...
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </form>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-6 text-center">
        <p className="text-xs text-muted-foreground font-body">
          © 2026. Built with ❤️ using{" "}
          <a
            href="https://caffeine.ai"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
