import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin, useUserProfile } from "./hooks/useQueries";
import { AdminLayout } from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import KitchenDisplay from "./pages/KitchenDisplay";
import CustomerOrder from "./pages/CustomerOrder";
import Login from "./pages/Login";
import AdminSetup from "./pages/AdminSetup";

// Admin guard component - shown for all admin routes
function AdminGuard() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();

  const isLoading = isInitializing || adminLoading || profileLoading;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-48 h-8" />
      </div>
    );
  }

  // Not logged in
  if (!identity) {
    return <Login />;
  }

  // Still loading admin status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-48 h-8" />
      </div>
    );
  }

  // No profile yet (new user) — show profile setup so backend can auto-assign admin on first login
  if (!userProfile?.name) {
    return <AdminSetup />;
  }

  // Has a profile but not admin — truly access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-sidebar-foreground font-display text-xl font-bold">Access Denied</p>
          <p className="text-sidebar-foreground/60 font-body text-sm">
            You don't have admin access to SaladStation.
          </p>
          <p className="text-sidebar-foreground/40 font-body text-xs">
            Sign in with the owner account to manage your kitchen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster position="top-right" />
      <Outlet />
    </>
  ),
});

// Public routes
const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order",
  component: CustomerOrder,
});

const kitchenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kitchen",
  component: KitchenDisplay,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

// Admin layout route
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin",
  component: AdminGuard,
});

const dashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  component: Dashboard,
});

const menuRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/menu",
  component: MenuManagement,
});

const ordersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/orders",
  component: Orders,
});

const inventoryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/inventory",
  component: Inventory,
});

const analyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/analytics",
  component: Analytics,
});

const routeTree = rootRoute.addChildren([
  orderRoute,
  kitchenRoute,
  loginRoute,
  adminLayoutRoute.addChildren([
    dashboardRoute,
    menuRoute,
    ordersRoute,
    inventoryRoute,
    analyticsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
