import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AdminLayout } from "./components/AdminLayout";
import Analytics from "./pages/Analytics";
import CustomerOrder from "./pages/CustomerOrder";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import KitchenDisplay from "./pages/KitchenDisplay";
import MenuManagement from "./pages/MenuManagement";
import Orders from "./pages/Orders";
import Plans from "./pages/Plans";
import Subscriptions from "./pages/Subscriptions";

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

const subscriptionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/subscriptions",
  component: Subscriptions,
});

const customersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/customers",
  component: Customers,
});

const plansRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/plans",
  component: Plans,
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
    subscriptionsRoute,
    plansRoute,
    customersRoute,
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
