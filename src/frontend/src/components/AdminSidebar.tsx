import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Package,
  BarChart3,
  Monitor,
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronLeft,
  CalendarDays,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/menu", icon: UtensilsCrossed, label: "Menu" },
  { to: "/orders", icon: ClipboardList, label: "Orders" },
  { to: "/subscriptions", icon: CalendarDays, label: "Subscriptions" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/kitchen", icon: Monitor, label: "Kitchen Display" },
];

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
  const location = useLocation();
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();

  function handleSignOut() {
    qc.clear();
    clear();
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out h-full",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md ember-gradient flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-wide text-sidebar-foreground">
              SALAD<span className="text-primary">STATION</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-md ember-gradient flex items-center justify-center mx-auto">
            <Leaf className="w-4 h-4 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "mx-auto mt-1"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link key={to} to={to}>
              <div
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5 rounded-md text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="font-body text-sm">{label}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors",
            collapsed ? "justify-center px-2" : "justify-start gap-3"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="font-body text-sm">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}

// Mobile nav bar
export function MobileAdminNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();

  function handleSignOut() {
    qc.clear();
    clear();
    setOpen(false);
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded ember-gradient flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-base font-bold text-sidebar-foreground">
            SALAD<span className="text-primary">STATION</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {open && (
        <div className="lg:hidden bg-sidebar border-b border-sidebar-border animate-slide-up">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link key={to} to={to} onClick={() => setOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                </Link>
              );
            })}
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
