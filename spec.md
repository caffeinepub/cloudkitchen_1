# SaladStation

## Current State
The app already has a basic subscription system with:
- `Subscription` type: id, customerName, customerPhone, plan (weekly/monthly), startDate, status (active/paused/cancelled), totalDeliveriesMade
- Backend functions: createSubscription, getAllSubscriptions, updateSubscriptionStatus, getActiveSubscriptionCount
- Frontend: Subscriptions admin page (table with pause/resume/cancel), SubscribePage (public signup)
- Plans: Weekly (6 bowls/week), Monthly (24 bowls/month)

## Requested Changes (Diff)

### Add
- **endDate** field to Subscription (computed from startDate + plan duration: 7 days for weekly, 30 days for monthly)
- **bowlSize** field to Subscription (small / medium / large)
- **price** field to Subscription (stored at time of creation)
- **paymentStatus** field to Subscription (pending / paid / overdue)
- **`expired`** status to SubscriptionStatus (in addition to active/paused/cancelled)
- Backend function `checkAndExpireSubscriptions` -- marks active/paused subscriptions as expired if endDate has passed
- Backend function `getExpiringSubscriptions` -- returns subscriptions expiring within 2 days (for alerts)
- Backend function `updateSubscription` -- allows admin to edit bowl size, price, payment status
- Frontend: Expiry alert banner on Subscriptions page showing count of subscriptions expiring in 2 days
- Frontend: "Expired" stat card and expired status badge (red/gray)
- Frontend: Bowl size, price, payment status, and end date columns in the subscriptions table
- Frontend: Edit dialog for updating bowl size, price, payment status
- Frontend: Auto-refresh to run expiry check on page load and periodically
- Public SubscribePage: Add bowl size selector, price display per plan, and payment status collection (defaults to pending)

### Modify
- `createSubscription` backend: accept bowlSize, price, paymentStatus, and calculate endDate from startDate + plan duration
- `Subscription` type: add endDate, bowlSize, price, paymentStatus fields
- SubscribePage frontend: add bowl size selection (small/medium/large) to signup form
- Subscriptions admin table: show end date, bowl size, price, payment status columns; add "Expired" filter tab; call expiry check on load

### Remove
- Nothing removed

## Implementation Plan
1. Update backend Motoko:
   - Add BowlSize variant (small/medium/large)
   - Add PaymentStatus variant (pending/paid/overdue)
   - Add `expired` to SubscriptionStatus
   - Add endDate, bowlSize, price, paymentStatus fields to Subscription
   - Update createSubscription to accept bowlSize and price, compute endDate, set paymentStatus
   - Add checkAndExpireSubscriptions (public, no auth -- called by frontend on load)
   - Add getExpiringSubscriptions (admin) -- returns subs where endDate is within 2 days
   - Add updateSubscription (admin) -- edits bowlSize, price, paymentStatus

2. Update frontend hooks in useQueries.ts:
   - Update createSubscription mutation params
   - Add useCheckAndExpireSubscriptions (mutation)
   - Add useExpiringSubscriptions (query)
   - Add useUpdateSubscription mutation

3. Update Subscriptions admin page:
   - Call checkAndExpireSubscriptions on mount
   - Show expiry alert banner if any subs expiring in <=2 days
   - Add Expired stat card
   - Add end date, bowl size, price, payment status to table
   - Add edit dialog for bowl size, price, payment status
   - Add Expired status badge

4. Update SubscribePage:
   - Add bowl size selector
   - Show price per plan (admin sets prices, or default pricing shown)
   - Include bowlSize in createSubscription call

## UX Notes
- Expiry alert banner should be prominent (amber/warning color) at top of Subscriptions page
- Expired subscriptions should be visually distinct (muted/gray) in the table
- Bowl sizes: Small, Medium, Large
- Payment status badges: Pending (amber), Paid (green), Overdue (red)
- End date shown in table; subs expiring in 2 days highlighted with warning color
- Price displayed in Indian Rupee (₹) format or plain number -- store as Float
