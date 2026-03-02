import { Button } from "@/components/ui/button";
import { Leaf, Printer, X } from "lucide-react";
import type { Order } from "../backend.d";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  menuItem: {
    id: bigint;
    name: string;
    price: number;
  };
  quantity: number;
}

type PaymentMethod = "cash" | "card" | "upi";

interface ReceiptModalProps {
  order: Order;
  cartSnapshot: CartItem[];
  paymentMethod: PaymentMethod;
  amountTendered: string;
  change: number;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(ns: bigint): { date: string; time: string } {
  const ms = Number(ns / 1_000_000n);
  const d = new Date(ms);
  return {
    date: d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ReceiptModal({
  order,
  cartSnapshot,
  paymentMethod,
  amountTendered,
  change,
  onClose,
}: ReceiptModalProps) {
  const { date, time } = formatDateTime(order.createdAt);
  const orderId = `#${String(order.id).padStart(4, "0")}`;
  const isCash = paymentMethod === "cash";
  const tenderedNum = Number.parseFloat(amountTendered) || 0;

  const lineItems = cartSnapshot.map((item) => ({
    id: String(item.menuItem.id),
    name: item.menuItem.name,
    qty: item.quantity,
    unitPrice: item.menuItem.price,
    lineTotal: item.menuItem.price * item.quantity,
  }));

  const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* ── Print + screen styles ────────────────────────────────────────── */}
      <style>{`
        /* ── Screen: hide everything except the receipt area ── */
        @media print {
          body * { visibility: hidden !important; }
          .receipt-print-area,
          .receipt-print-area * { visibility: visible !important; }
          .receipt-print-area {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            padding: 0 !important;
            background: white !important;
            z-index: 9999 !important;
          }
          .receipt-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            background: white !important;
            color: black !important;
          }
          .receipt-no-print { display: none !important; }

          /* ── Unified receipt typography for print ── */
          .receipt-card,
          .receipt-card * {
            font-family: Arial, Helvetica, sans-serif !important;
            color: black !important;
            background: white !important;
          }
          .receipt-header-title {
            font-size: 16px !important;
            font-weight: bold !important;
          }
          .receipt-header-meta {
            font-size: 11px !important;
            font-weight: normal !important;
          }
          .receipt-order-id {
            font-size: 12px !important;
            font-weight: bold !important;
          }
          .receipt-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 12px !important;
            font-weight: normal !important;
            table-layout: fixed !important;
          }
          .receipt-table th {
            font-size: 10px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            border-bottom: 1px dashed black !important;
            padding: 2px 2px 4px !important;
          }
          .receipt-table td {
            padding: 3px 2px !important;
            vertical-align: top !important;
            font-size: 12px !important;
            font-weight: normal !important;
          }
          .receipt-col-item  { width: 45% !important; text-align: left !important; word-wrap: break-word !important; }
          .receipt-col-qty   { width: 10% !important; text-align: center !important; }
          .receipt-col-price { width: 22% !important; text-align: right !important; }
          .receipt-col-total { width: 23% !important; text-align: right !important; }
          .receipt-divider {
            border: none !important;
            border-top: 1px solid black !important;
            margin: 4px 0 !important;
          }
          .receipt-divider-dashed {
            border: none !important;
            border-top: 1px dashed black !important;
            margin: 4px 0 !important;
          }
          .receipt-totals-row {
            font-size: 12px !important;
            font-weight: normal !important;
          }
          .receipt-grand-total-label {
            font-size: 14px !important;
            font-weight: bold !important;
          }
          .receipt-grand-total-amount {
            font-size: 14px !important;
            font-weight: bold !important;
          }
          .receipt-footer {
            font-size: 11px !important;
            font-weight: normal !important;
            text-align: center !important;
          }
        }

        /* ── Screen: item table layout ── */
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .receipt-col-item  { width: 45%; text-align: left; }
        .receipt-col-qty   { width: 10%; text-align: center; }
        .receipt-col-price { width: 22%; text-align: right; }
        .receipt-col-total { width: 23%; text-align: right; }
      `}</style>

      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        {/* Print area wrapper */}
        <div className="receipt-print-area">
          {/* Receipt Card */}
          <div className="receipt-card relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="receipt-no-print absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Receipt content */}
            <div className="p-6 space-y-3">
              {/* ── Store header ── */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center receipt-no-print">
                    <Leaf className="w-4 h-4 text-primary" />
                  </div>
                  <span className="receipt-header-title font-display text-xl font-bold text-foreground tracking-tight">
                    SaladStation
                  </span>
                </div>
                <p className="receipt-header-meta text-xs text-muted-foreground">
                  {date} &middot; {time}
                </p>
                <p className="receipt-order-id text-sm font-semibold text-foreground">
                  Order {orderId}
                </p>
              </div>

              {/* ── Divider ── */}
              <hr className="receipt-divider border-t border-border" />

              {/* ── Items table ── */}
              <table className="receipt-table text-sm">
                <colgroup>
                  <col className="receipt-col-item" />
                  <col className="receipt-col-qty" />
                  <col className="receipt-col-price" />
                  <col className="receipt-col-total" />
                </colgroup>
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-dashed border-border">
                    <th className="receipt-col-item pb-1.5 font-semibold text-left">
                      Item
                    </th>
                    <th className="receipt-col-qty pb-1.5 font-semibold text-center">
                      Qty
                    </th>
                    <th className="receipt-col-price pb-1.5 font-semibold text-right">
                      Price
                    </th>
                    <th className="receipt-col-total pb-1.5 font-semibold text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="receipt-col-item py-1 pr-1 text-foreground leading-snug break-words">
                        {item.name}
                      </td>
                      <td className="receipt-col-qty py-1 text-center text-muted-foreground tabular-nums">
                        {item.qty}
                      </td>
                      <td className="receipt-col-price py-1 text-right text-muted-foreground tabular-nums">
                        &#8377;{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="receipt-col-total py-1 text-right text-foreground tabular-nums font-medium">
                        &#8377;{item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Dashed divider ── */}
              <hr className="receipt-divider-dashed border-t border-dashed border-border" />

              {/* ── Totals section ── */}
              <div className="space-y-1.5">
                <div className="receipt-totals-row flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    &#8377;{subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="receipt-totals-row flex justify-between text-sm text-muted-foreground">
                  <span>Payment</span>
                  <span>{paymentLabels[paymentMethod]}</span>
                </div>

                {isCash && tenderedNum > 0 && (
                  <>
                    <div className="receipt-totals-row flex justify-between text-sm text-muted-foreground">
                      <span>Amount Tendered</span>
                      <span className="tabular-nums">
                        &#8377;{tenderedNum.toFixed(2)}
                      </span>
                    </div>
                    <div className="receipt-totals-row flex justify-between text-sm text-muted-foreground">
                      <span>Change Due</span>
                      <span className="tabular-nums">
                        &#8377;{change.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                <hr className="receipt-divider border-t border-border" />

                {/* Grand total */}
                <div className="flex justify-between items-baseline pt-0.5">
                  <span className="receipt-grand-total-label font-display text-base font-bold text-foreground uppercase tracking-wide">
                    Total
                  </span>
                  <span className="receipt-grand-total-amount font-display text-2xl font-bold text-primary tabular-nums">
                    &#8377;{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <hr className="receipt-divider-dashed border-t border-dashed border-border" />

              {/* Footer */}
              <p className="receipt-footer text-center text-xs text-muted-foreground">
                Thank you for your order! 🥗
              </p>
            </div>

            {/* Action buttons (non-printing) */}
            <div className="receipt-no-print px-6 pb-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-sm h-9"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                className="flex-1 text-sm h-9 ember-gradient text-white border-0"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
