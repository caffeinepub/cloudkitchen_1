# SaladStation

## Current State
Full-stack cloud kitchen management app with:
- Menu management (CRUD, availability toggle, salad categories)
- Order management (kanban board, status updates)
- Inventory management (stock tracking, low-stock alerts)
- Subscription management (weekly/monthly plans, bowl sizes, payment status, expiry alerts)
- Analytics (revenue, top items, daily breakdown)
- Kitchen display (auto-refresh)
- Customer ordering page at /order
- No authentication (open access)

Missing: Customer profile management tab.

## Requested Changes (Diff)

### Add
- `Customer` type in backend with: id, name, mobileNo, preferences (text), address
- `createCustomer` function (admin)
- `updateCustomer` function (admin)
- `deleteCustomer` function (admin)
- `getAllCustomers` query (admin)
- `getCustomer` query (admin)
- Customers page in admin sidebar (/customers route)
- "Add Customer" form with name, mobile number, preferences, address fields
- Customer table with edit and delete actions

### Modify
- Backend: add customer storage (Map) and nextCustomerId counter
- App.tsx: add /customers route
- AdminLayout sidebar: add Customers nav item

### Remove
- Nothing

## Implementation Plan
1. Add Customer type, storage, and CRUD functions to Motoko backend
2. Regenerate backend.d.ts bindings
3. Create Customers page in frontend with table + add/edit/delete modal
4. Add /customers route to App.tsx and sidebar nav item in AdminLayout
