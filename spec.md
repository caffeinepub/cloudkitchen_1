# SaladStation

## Current State
A cloud kitchen management app called "CLOUDFIRE" with an ember/fire branding (orange gradients, Flame icon). It includes:
- Admin dashboard with stats, orders, inventory, analytics
- Customer ordering page at `/order`
- Menu management with generic categories: Appetizers, Mains, Sides, Desserts, Beverages, Specials, Other
- Branding text: "CLOUDFIRE", "Fresh from our cloud kitchen", "Kitchen Management System"
- Orange/amber color scheme with fire-themed gradients

## Requested Changes (Diff)

### Add
- Salad-specific menu categories: Salads, Bowls, Wraps, Toppings, Dressings, Drinks, Specials
- Fresh green color palette (primary: green/lime tones using OKLCH)
- Leaf icon instead of Flame icon for the logo

### Modify
- Brand name: "CLOUDFIRE" → "SALAD STATION" (or stylized "SALAD<accent>STATION</accent>")
- Tagline on customer page: "Fresh from our cloud kitchen" → "Fresh, healthy salads made to order"
- Tagline on login page: "Kitchen Management System" → "Salad Bar Management System"
- Admin login card description: update to reference salad bar management
- Color scheme: orange ember theme → fresh green/leaf theme
- `ember-gradient` style → fresh green gradient
- Customer order page success message: "We'll prepare it fresh for you!" → "Your fresh salad is being prepared!"
- MenuManagement CATEGORIES array → salad-focused categories
- Dashboard page copy: no changes needed (generic enough)

### Remove
- Fire/ember visual metaphors (Flame icon, ember-gradient class references in branding elements)

## Implementation Plan
1. Rename project to "SaladStation"
2. Update `index.css`: change primary color from amber/orange to green, update `ember-gradient` to a fresh green gradient
3. Update `AdminSidebar.tsx`: replace Flame with Leaf icon, change "CLOUDFIRE" to "SALAD<accent>STATION</accent>"
4. Update `MobileAdminNav` in `AdminSidebar.tsx`: same logo/name change
5. Update `Login.tsx`: change logo icon, brand name, and tagline
6. Update `CustomerOrder.tsx`: change header logo/brand name, update success message tagline
7. Update `MenuManagement.tsx`: replace CATEGORIES with salad-focused list

## UX Notes
- Keep the dark sidebar with light text -- it works well for a kitchen environment
- Green primary fits salads naturally -- aim for a fresh, crisp feel
- Maintain all existing layout/structure, only change copy, colors, and icons
