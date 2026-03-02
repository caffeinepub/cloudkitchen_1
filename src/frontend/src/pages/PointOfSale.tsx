import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Customer, MenuItem, Order, OrderItem } from "../backend.d";
import { ReceiptModal } from "../components/ReceiptModal";
import {
  useAllCustomers,
  useAvailableMenuItems,
  usePlaceOrder,
} from "../hooks/useQueries";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

type PaymentMethod = "cash" | "card" | "upi";

// ─── Category Filter ────────────────────────────────────────────────────────────

function CategoryFilter({
  categories,
  selected,
  onChange,
}: {
  categories: string[];
  selected: string | null;
  onChange: (cat: string | null) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border",
          selected === null
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat === selected ? null : cat)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border",
            selected === cat
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Menu Item Card ─────────────────────────────────────────────────────────────

function MenuItemCard({
  item,
  inCart,
  onAdd,
}: {
  item: MenuItem;
  inCart: boolean;
  onAdd: (item: MenuItem) => void;
}) {
  const [flash, setFlash] = useState(false);

  function handleClick() {
    onAdd(item);
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group relative w-full text-left rounded-lg border bg-card p-3 transition-all",
        "hover:border-primary/60 hover:shadow-sm active:scale-[0.97]",
        flash && "border-primary bg-primary/5 scale-[0.97]",
        inCart && "border-primary/40 bg-primary/5",
      )}
    >
      {/* Quick-add flash overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg bg-primary/10 pointer-events-none transition-opacity",
          flash ? "opacity-100" : "opacity-0",
        )}
      />
      {inCart && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}
      <div className="pr-6">
        <p className="font-body font-semibold text-sm text-foreground leading-tight line-clamp-2">
          {item.name}
        </p>
        <Badge
          variant="secondary"
          className="mt-1.5 text-[10px] font-body px-1.5 py-0 h-4"
        >
          {item.category}
        </Badge>
        <p className="font-display text-base font-bold text-primary mt-1.5">
          ₹{item.price.toFixed(2)}
        </p>
      </div>
    </button>
  );
}

// ─── Cart Item Row ──────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  onUpdate: (menuItemId: bigint, qty: number) => void;
  onRemove: (menuItemId: bigint) => void;
}) {
  const lineTotal = item.menuItem.price * item.quantity;

  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-border last:border-0">
      {/* Item name */}
      <div className="flex-1 min-w-0">
        <p className="font-body font-medium text-sm text-foreground truncate">
          {item.menuItem.name}
        </p>
        <p className="font-body text-xs text-muted-foreground">
          ₹{item.menuItem.price.toFixed(2)} each
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            item.quantity > 1
              ? onUpdate(item.menuItem.id, item.quantity - 1)
              : onRemove(item.menuItem.id)
          }
          className="w-6 h-6 rounded flex items-center justify-center border border-border hover:border-primary/60 hover:bg-primary/5 transition-all"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center font-body font-semibold text-sm text-foreground">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdate(item.menuItem.id, item.quantity + 1)}
          className="w-6 h-6 rounded flex items-center justify-center border border-border hover:border-primary/60 hover:bg-primary/5 transition-all"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Line total */}
      <span className="font-display font-bold text-sm text-foreground w-16 text-right">
        ₹{lineTotal.toFixed(2)}
      </span>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(item.menuItem.id)}
        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Customer Picker ────────────────────────────────────────────────────────────

interface CustomerPickerProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  walkInName: string;
  walkInPhone: string;
  onSelectCustomer: (c: Customer | null) => void;
  onWalkInNameChange: (v: string) => void;
  onWalkInPhoneChange: (v: string) => void;
}

function CustomerPicker({
  customers,
  selectedCustomer,
  walkInName,
  walkInPhone,
  onSelectCustomer,
  onWalkInNameChange,
  onWalkInPhoneChange,
}: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobileNo.toLowerCase().includes(q),
    );
  }, [customers, search]);

  function handleSelect(c: Customer | null) {
    onSelectCustomer(c);
    setOpen(false);
    setSearch("");
  }

  const displayLabel = selectedCustomer
    ? `${selectedCustomer.name} · ${selectedCustomer.mobileNo}`
    : "Walk-in / New Customer";

  const isWalkIn = selectedCustomer === null;

  return (
    <div className="space-y-2">
      <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">
        Customer
      </Label>

      {/* Dropdown trigger */}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm font-body transition-all",
            "bg-card text-foreground border-border hover:border-primary/60",
            open && "border-primary ring-1 ring-primary/20",
          )}
        >
          <span className={cn(!selectedCustomer && "text-muted-foreground")}>
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg animate-slide-up">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone…"
                  className="w-full pl-7 pr-2 py-1.5 text-xs font-body bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
            <ScrollArea className="max-h-48">
              {/* Walk-in option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm font-body hover:bg-accent/60 transition-colors",
                  isWalkIn && "bg-primary/10 text-primary",
                )}
              >
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm leading-tight">
                    Walk-in / New Customer
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enter details manually
                  </p>
                </div>
                {isWalkIn && <Check className="w-4 h-4 ml-auto text-primary" />}
              </button>

              {filtered.map((c) => (
                <button
                  key={String(c.id)}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm font-body hover:bg-accent/60 transition-colors",
                    selectedCustomer?.id === c.id &&
                      "bg-primary/10 text-primary",
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-display text-xs font-bold text-primary">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.mobileNo}
                    </p>
                  </div>
                  {selectedCustomer?.id === c.id && (
                    <Check className="w-4 h-4 ml-auto text-primary shrink-0" />
                  )}
                </button>
              ))}

              {filtered.length === 0 && search.trim() && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground font-body">
                  No customers match "{search}"
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Walk-in fields */}
      {isWalkIn && (
        <div className="grid grid-cols-2 gap-2 animate-slide-up">
          <div className="space-y-1">
            <Label
              htmlFor="pos-walkin-name"
              className="font-body text-xs text-muted-foreground"
            >
              Name
            </Label>
            <Input
              id="pos-walkin-name"
              type="text"
              value={walkInName}
              onChange={(e) => onWalkInNameChange(e.target.value)}
              placeholder="Customer name"
              className="font-body h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="pos-walkin-phone"
              className="font-body text-xs text-muted-foreground"
            >
              Phone
            </Label>
            <Input
              id="pos-walkin-phone"
              type="tel"
              value={walkInPhone}
              onChange={(e) => onWalkInPhoneChange(e.target.value)}
              placeholder="Mobile number"
              className="font-body h-8 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Method Toggle ──────────────────────────────────────────────────────

function PaymentToggle({
  method,
  onChange,
}: {
  method: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}) {
  const options: {
    value: PaymentMethod;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "cash", label: "Cash", icon: <Wallet className="w-3.5 h-3.5" /> },
    {
      value: "card",
      label: "Card",
      icon: <CreditCard className="w-3.5 h-3.5" />,
    },
    {
      value: "upi",
      label: "UPI",
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-md">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-body font-medium transition-all",
            method === opt.value
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PointOfSale() {
  const { data: menuItems, isLoading: menuLoading } = useAvailableMenuItems();
  const { data: customers = [] } = useAllCustomers();
  const placeOrder = usePlaceOrder();

  // Menu state
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [menuSearch, setMenuSearch] = useState("");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");

  // Receipt state
  const [completedOrderReceipt, setCompletedOrderReceipt] = useState<{
    order: Order;
    cartSnapshot: CartItem[];
    paymentMethod: PaymentMethod;
    amountTendered: string;
    change: number;
  } | null>(null);

  // Derived values
  const categories = useMemo(() => {
    const cats = [...new Set((menuItems ?? []).map((m) => m.category))];
    return cats.sort();
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    let items = menuItems ?? [];
    if (categoryFilter)
      items = items.filter((m) => m.category === categoryFilter);
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q),
      );
    }
    return items;
  }, [menuItems, categoryFilter, menuSearch]);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [cart],
  );

  const change = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    const tendered = Number.parseFloat(amountTendered) || 0;
    return Math.max(tendered - cartTotal, 0);
  }, [paymentMethod, amountTendered, cartTotal]);

  const cartItemIds = useMemo(
    () => new Set(cart.map((c) => String(c.menuItem.id))),
    [cart],
  );

  // Cart actions
  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function updateCartQty(menuItemId: bigint, qty: number) {
    if (qty <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.menuItem.id === menuItemId ? { ...c, quantity: qty } : c,
      ),
    );
  }

  function removeFromCart(menuItemId: bigint) {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== menuItemId));
  }

  function clearCart() {
    setCart([]);
    setWalkInName("");
    setWalkInPhone("");
    setSelectedCustomer(null);
    setAmountTendered("");
    setPaymentMethod("cash");
  }

  // Complete sale
  async function handleCompleteSale() {
    if (cart.length === 0) {
      toast.error("Add at least one item to the cart");
      return;
    }

    const customerName = selectedCustomer
      ? selectedCustomer.name
      : walkInName.trim() || "Walk-in Customer";
    const customerPhone = selectedCustomer
      ? selectedCustomer.mobileNo
      : walkInPhone.trim() || "";

    const orderItems: OrderItem[] = cart.map((item) => ({
      menuItemId: item.menuItem.id,
      quantity: BigInt(item.quantity),
      unitPrice: item.menuItem.price,
    }));

    // Snapshot current state before clearing
    const cartSnapshot = [...cart];
    const currentPaymentMethod = paymentMethod;
    const currentAmountTendered = amountTendered;
    const currentChange = change;

    try {
      const placedOrder = await placeOrder.mutateAsync({
        customerName,
        customerPhone,
        items: orderItems,
        notes: `POS Sale · ${paymentMethod.toUpperCase()}`,
      });

      // Show receipt before clearing cart
      setCompletedOrderReceipt({
        order: placedOrder,
        cartSnapshot,
        paymentMethod: currentPaymentMethod,
        amountTendered: currentAmountTendered,
        change: currentChange,
      });

      toast.success("Sale completed! Receipt ready to print.");
      clearCart();
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  }

  return (
    <>
      {/* Receipt Modal */}
      {completedOrderReceipt && (
        <ReceiptModal
          order={completedOrderReceipt.order}
          cartSnapshot={completedOrderReceipt.cartSnapshot}
          paymentMethod={completedOrderReceipt.paymentMethod}
          amountTendered={completedOrderReceipt.amountTendered}
          change={completedOrderReceipt.change}
          onClose={() => setCompletedOrderReceipt(null)}
        />
      )}
      <div className="h-full flex flex-col animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md ember-gradient flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Point of Sale
              </h1>
              <p className="font-body text-xs text-muted-foreground">
                Manual sales terminal
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>

        {/* Two-panel body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* ─── LEFT: Menu Panel ─── */}
          <div className="flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-border min-h-0">
            {/* Menu filters */}
            <div className="px-4 pt-4 pb-3 space-y-2.5 shrink-0">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search menu items…"
                  className="pl-8 font-body h-8 text-sm"
                />
              </div>
              {/* Category filter */}
              {categories.length > 0 && (
                <CategoryFilter
                  categories={categories}
                  selected={categoryFilter}
                  onChange={setCategoryFilter}
                />
              )}
            </div>

            {/* Menu grid */}
            <ScrollArea className="flex-1 px-4 pb-4">
              {menuLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }, (_, i) => `sk-${i}`).map((k) => (
                    <Skeleton key={k} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredMenu.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-display text-lg font-bold text-foreground">
                    {menuSearch || categoryFilter
                      ? "No matching items"
                      : "No menu items available"}
                  </p>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {menuSearch || categoryFilter
                      ? "Try a different search or category"
                      : "Add items in Menu Management first"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                  {filteredMenu.map((item) => (
                    <MenuItemCard
                      key={String(item.id)}
                      item={item}
                      inCart={cartItemIds.has(String(item.id))}
                      onAdd={addToCart}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ─── RIGHT: Cart / Bill Panel ─── */}
          <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-card shrink-0 overflow-hidden min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-4">
                {/* Cart header */}
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Cart
                  </h2>
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="font-body text-xs">
                      {cart.reduce((s, c) => s + c.quantity, 0)} items
                    </Badge>
                  )}
                </div>

                {/* Cart items */}
                <Card className="kitchen-card">
                  <CardContent className="p-3">
                    {cart.length === 0 ? (
                      <div className="py-8 text-center">
                        <ShoppingCart className="w-10 h-10 text-muted-foreground/25 mx-auto mb-2" />
                        <p className="font-body text-sm text-muted-foreground">
                          Add items from the menu to start a sale
                        </p>
                      </div>
                    ) : (
                      <>
                        {cart.map((item) => (
                          <CartItemRow
                            key={String(item.menuItem.id)}
                            item={item}
                            onUpdate={updateCartQty}
                            onRemove={removeFromCart}
                          />
                        ))}

                        <div className="pt-2 flex items-center justify-between">
                          <span className="font-body text-sm font-semibold text-foreground">
                            Subtotal
                          </span>
                          <span className="font-display text-lg font-bold text-foreground">
                            ₹{cartTotal.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Customer section */}
                <CustomerPicker
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  walkInName={walkInName}
                  walkInPhone={walkInPhone}
                  onSelectCustomer={setSelectedCustomer}
                  onWalkInNameChange={setWalkInName}
                  onWalkInPhoneChange={setWalkInPhone}
                />

                {/* Payment section */}
                <div className="space-y-3">
                  <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                    Payment
                  </Label>

                  <PaymentToggle
                    method={paymentMethod}
                    onChange={setPaymentMethod}
                  />

                  {paymentMethod === "cash" && (
                    <div className="space-y-2 animate-slide-up">
                      <div className="space-y-1">
                        <Label
                          htmlFor="pos-tendered"
                          className="font-body text-xs text-muted-foreground"
                        >
                          Amount Tendered (₹)
                        </Label>
                        <Input
                          id="pos-tendered"
                          type="number"
                          min={0}
                          step={0.01}
                          value={amountTendered}
                          onChange={(e) => setAmountTendered(e.target.value)}
                          placeholder="0.00"
                          className="font-body text-sm h-8"
                        />
                      </div>
                      {amountTendered &&
                        Number.parseFloat(amountTendered) >= cartTotal && (
                          <div className="flex items-center justify-between bg-[oklch(0.68_0.18_155/0.12)] border border-[oklch(0.68_0.18_155/0.4)] rounded-md px-3 py-2 animate-slide-up">
                            <span className="font-body text-sm text-[oklch(0.45_0.18_155)]">
                              Change Due
                            </span>
                            <span className="font-display text-lg font-bold text-[oklch(0.45_0.18_155)]">
                              ₹{change.toFixed(2)}
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-foreground">
                    TOTAL
                  </span>
                  <span className="font-display text-2xl font-bold text-primary">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </ScrollArea>

            {/* Complete sale button — always visible */}
            <div className="p-4 pt-0 shrink-0">
              <Button
                onClick={handleCompleteSale}
                disabled={placeOrder.isPending || cart.length === 0}
                className="w-full h-12 ember-gradient text-white border-0 font-display text-lg tracking-wide transition-all"
              >
                {placeOrder.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Complete Sale · ₹{cartTotal.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
