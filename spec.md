# SaladStation

## Current State
The app uses Internet Identity authentication. The `AdminGuard` component gates all kitchen routes behind login. If not logged in, it shows the Login page. If logged in but no profile, it shows AdminSetup. If logged in but not admin, it shows "Access Denied". The backend enforces admin-only access on all management endpoints using role-based access control.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Backend: Remove admin permission checks from all management endpoints (menu, orders, inventory, analytics). All endpoints become open/public. Keep `placeOrder` and `getAvailableMenuItems` as-is (already public). Remove user profile and role management entirely or make them no-ops.
- Frontend `App.tsx`: Remove `AdminGuard` component. The admin layout route renders `AdminLayout` + `<Outlet />` directly, with no auth check.
- Frontend: Remove `Login.tsx` and `AdminSetup.tsx` pages (no longer needed).
- Frontend hooks: Remove `useIsAdmin`, `useUserProfile`, `useSaveUserProfile`, `useAssignAdminRole` from `useQueries.ts` since auth is gone.

### Remove
- Login page and route
- AdminSetup page
- AdminGuard component
- Authentication-related query hooks

## Implementation Plan
1. Regenerate backend without auth/roles -- all management endpoints are open
2. Update `App.tsx` to remove AdminGuard, show dashboard directly
3. Remove Login.tsx and AdminSetup.tsx
4. Remove auth hooks from useQueries.ts
5. Fix any TypeScript errors from removed imports

## UX Notes
- The app opens directly to the dashboard -- no login, no setup, no access denied screens
- Customer `/order` route remains public as-is
- Kitchen display at `/kitchen` remains public as-is
