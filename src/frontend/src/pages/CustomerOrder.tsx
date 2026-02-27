import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Minus,
  ShoppingCart,
  Leaf,
  CheckCircle2,
  Loader2,
  UtensilsCrossed,
  X,
  Salad,
  ArrowRight,
} from "lucide-react";
import { useAvailableMenuItems, usePlaceOrder } from "../hooks/useQueries";
import { MenuItem } from "../backend.d";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CartItem {
  item: MenuItem;
  quantity: number;
}

function MenuCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <Card className="kitchen-card overflow-hidden group transition-shadow hover:shadow-md animate-slide-up">
      {item.imageUrl && (
        <div className="h-36 bg-muted overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
        </div>
      )}
      <CardContent className="p-3">
        <h3 className="font-display font-semibold text-base leading-tight text-foreground">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-display text-xl font-bold text-primary">
            ${item.price.toFixed(2)}
          </span>
          <Button
            size="sm"
            className="h-8 w-8 p-0 rounded-full ember-gradient text-white border-0"
            onClick={() => onAdd(item)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CartPanel({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
  total,
  onCheckout,
}: {
  cart: CartItem[];
  onIncrease: (id: bigint) => void;
  onDecrease: (id: bigint) => void;
  onRemove: (id: bigint) => void;
  total: number;
  onCheckout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="font-display text-lg font-semibold text-foreground">
              Your cart is empty
            </p>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Add items from the menu
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-1">
            <div className="space-y-3 pb-4">
              {cart.map(({ item, quantity }) => (
                <div key={String(item.id)} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-body text-sm font-medium text-foreground leading-tight">
                        {item.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => onDecrease(item.id)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-mono text-sm font-bold w-5 text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => onIncrease(item.id)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-display text-sm font-bold text-primary">
                        ${(item.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between font-display font-bold">
            <span className="text-base text-foreground">Total</span>
            <span className="text-xl text-primary">${total.toFixed(2)}</span>
          </div>
          <Button
            className="w-full ember-gradient text-white border-0 font-display text-sm font-bold tracking-wider"
            onClick={onCheckout}
          >
            Place Order
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CustomerOrder() {
  const { data: menuItems, isLoading } = useAvailableMenuItems();
  const placeOrder = usePlaceOrder();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });

  const categories = useMemo(() => {
    if (!menuItems) return ["all"];
    const cats = Array.from(new Set(menuItems.map((i) => i.category)));
    return ["all", ...cats];
  }, [menuItems]);

  const filteredItems = useMemo(
    () =>
      menuItems?.filter(
        (i) => filterCategory === "all" || i.category === filterCategory
      ) ?? [],
    [menuItems, filterCategory]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0),
    [cart]
  );

  const cartCount = cart.reduce((sum, { quantity }) => sum + quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`, { duration: 1500 });
  }

  function increaseQuantity(id: bigint) {
    setCart((prev) =>
      prev.map((c) =>
        c.item.id === id ? { ...c, quantity: c.quantity + 1 } : c
      )
    );
  }

  function decreaseQuantity(id: bigint) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.item.id === id ? { ...c, quantity: c.quantity - 1 } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  function removeFromCart(id: bigint) {
    setCart((prev) => prev.filter((c) => c.item.id !== id));
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please fill in your name and phone number");
      return;
    }
    try {
      const order = await placeOrder.mutateAsync({
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        items: cart.map(({ item, quantity }) => ({
          menuItemId: item.id,
          quantity: BigInt(quantity),
          unitPrice: item.price,
        })),
        notes: form.notes.trim(),
      });
      setSuccessOrder(String(order.id).padStart(4, "0"));
      setCart([]);
      setCheckoutOpen(false);
      setForm({ name: "", phone: "", notes: "" });
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md ember-gradient flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              SALAD<span className="text-primary">STATION</span>
            </span>
          </div>
          {/* Mobile cart button */}
          <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="lg:hidden relative gap-2 border-sidebar-border text-sidebar-foreground bg-sidebar-accent hover:bg-sidebar-accent/80"
              >
                <ShoppingCart className="w-4 h-4" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full ember-gradient text-white text-xs font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 flex flex-col">
              <SheetHeader>
                <SheetTitle className="font-display text-xl">Your Order</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden mt-4">
                <CartPanel
                  cart={cart}
                  onIncrease={increaseQuantity}
                  onDecrease={decreaseQuantity}
                  onRemove={removeFromCart}
                  total={cartTotal}
                  onCheckout={() => {
                    setMobileCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Menu section */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          <div className="mb-4">
            <h1 className="font-display text-3xl font-bold text-foreground">Order Online</h1>
            <p className="text-muted-foreground font-body text-sm mt-0.5">
              Fresh, healthy salads made to order
            </p>
          </div>

          {/* Subscription Banner */}
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg ember-gradient flex items-center justify-center shrink-0">
                <Salad className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-foreground text-sm">
                  Want salads every week?
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  Subscribe and get 6 fresh bowls weekly or 24 monthly.
                </p>
              </div>
            </div>
            <a
              href="/subscribe"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-body font-semibold text-primary hover:underline"
            >
              View Plans
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-display font-semibold tracking-wider uppercase transition-all whitespace-nowrap shrink-0",
                  filterCategory === cat
                    ? "ember-gradient text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                {cat === "all" ? "All Items" : cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(["m1","m2","m3","m4","m5","m6"]).map((k) => (
                <Skeleton key={k} className="h-52 rounded-md" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="font-display text-xl font-bold text-foreground">
                No items available
              </h3>
              <p className="text-muted-foreground font-body text-sm mt-1">
                Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <MenuCard key={String(item.id)} item={item} onAdd={addToCart} />
              ))}
            </div>
          )}
        </main>

        {/* Desktop cart sidebar */}
        <aside className="hidden lg:flex w-80 flex-col border-l bg-card p-4 sticky top-[57px] h-[calc(100vh-57px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-foreground">Your Order</h2>
            {cartCount > 0 && (
              <Badge className="ember-gradient text-white border-0 font-body">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <Separator className="mb-4" />
          <CartPanel
            cart={cart}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
            onRemove={removeFromCart}
            total={cartTotal}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t py-4 px-6 text-center">
        <p className="text-xs text-muted-foreground font-body">
          © 2026. Built with ❤️ using{" "}
          <a href="https://caffeine.ai" className="underline hover:text-foreground transition-colors">
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Complete Your Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div className="bg-secondary rounded-md p-3 space-y-1.5">
              {cart.map(({ item, quantity }) => (
                <div key={String(item.id)} className="flex justify-between text-sm font-body">
                  <span className="text-foreground">
                    {quantity}× {item.name}
                  </span>
                  <span className="text-muted-foreground">
                    ${(item.price * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-display font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-name" className="font-body text-sm">Your Name *</Label>
              <Input
                id="cust-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Sarah Johnson"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone" className="font-body text-sm">Phone Number *</Label>
              <Input
                id="cust-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
                placeholder="e.g. +1 555 000 1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-notes" className="font-body text-sm">
                Special Instructions
              </Label>
              <Textarea
                id="cust-notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Allergies, preferences..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCheckoutOpen(false)}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 ember-gradient text-white border-0 font-display font-bold tracking-wider"
                disabled={placeOrder.isPending || cart.length === 0}
              >
                {placeOrder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Order"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={successOrder !== null} onOpenChange={() => setSuccessOrder(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-full bg-[oklch(0.72_0.19_155/15)] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[oklch(0.72_0.19_155)]" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">
              Order Placed!
            </h2>
            <p className="font-body text-muted-foreground text-sm mb-3">
              Your order #{successOrder} is confirmed. Your fresh salad is being prepared!
            </p>
            <Button
              className="ember-gradient text-white border-0 font-display"
              onClick={() => setSuccessOrder(null)}
            >
              Order More
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
