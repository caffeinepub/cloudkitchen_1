import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AdminLayout } from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import KitchenDisplay from "./pages/KitchenDisplay";
import CustomerOrder from "./pages/CustomerOrder";

// Admin layout — no authentication required, open access
function AdminGuard() {
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
