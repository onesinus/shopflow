# ShopFlow — Teacher Key (DO NOT distribute to students)

Exact locations and intended fixes for the `docs/challenges.md` board. Keep
this file out of any student-shared copy of the repository.

---

## C01 — Cart lets you oversell on update
- **Location**: `backend/src/services/cartService.js` → `updateItem()`.
- **Cause**: the stock-capacity check was removed from the update path.
- **Fix**: restore the check so the new quantity is validated against available
  stock, e.g. re-add:
  ```js
  const stock = await stockFor({ productId: item.productId, variantId: item.variantId });
  if (qty > stock) throw ApiError.unprocessable(`Only ${stock} units in stock`);
  ```
  before `item.quantity = qty;`.
- **Verify**: `tests/integration/challenges.test.js` → `C01` turns green.

## C02 — Cancelled orders keep the stock
- **Location**: `backend/src/services/orderService.js` → `cancelOrder()`.
- **Cause**: `cancelOrder()` flips status/payment but never restores inventory
  (unlike `createOrder()`, which decrements it).
- **Fix**: for each `OrderItem` on the order, find the matching `Inventory`
  (by `variantId` if present, else by `productId`) and return its quantity,
  before (or after) saving the cancellation.
- **Verify**: `tests/integration/challenges.test.js` → `C02` turns green.

## C03 — Sales report drops the "to" day
- **Location**: `backend/src/services/adminService.js` → `getSalesReport()`.
- **Cause**: `toDate = new Date(to)` is midnight; `createdAt <= toDate` excludes
  every order placed later on the end day.
- **Fix**: extend the upper bound to the end of the day, e.g.
  ```js
  const toEnd = new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  ```
  and compare `createdAt <= toEnd`. (Mind the existing `B07` timezone caveat.)

## C04 — Two default addresses
- **Location**: `backend/src/services/userService.js` → `addAddress()`.
- **Cause**: when a new address is created with `isDefault: true`, existing
  default rows are not cleared.
- **Fix**: when `isDefault` is truthy (or it is the user's first address),
  first run
  `models.Address.update({ isDefault: false }, { where: { userId } })`.
- **Verify**: `tests/integration/challenges.test.js` → `C04` turns green.

## C05 — Wishlist stores duplicate rows
- **Location**: `backend/src/services/wishlistService.js` → `addItem()`.
- **Cause**: it now does a bare `WishlistItem.create(...)` for every call.
- **Fix**: restore an upsert so the same `(userId, productId)` never repeats:
  ```js
  const [item] = await models.WishlistItem.findOrCreate({ where: { userId, productId } });
  return item;
  ```
  (A unique constraint on `(user_id, product_id)` is the more robust option.)
- **Verify**: `tests/integration/challenges.test.js` → `C05` turns green.

---

## Frontend

### C06 — Navbar cart badge (feature)
- **Location**: `frontend/src/components/Navbar.jsx`, plus cart data source
  (`frontend/src/api/cart.js` → `cartApi.get()`).
- **Approach**: for authenticated users, fetch the cart (or reuse a shared
  cart context) and render a small count badge next to the **Cart** nav link.
  Keep it live when cart/checkout changes. There is no test for this — grade
  by running the app.

### C07 — Checkout summary ignores coupon
- **Location**: `frontend/src/pages/CheckoutPage.jsx` → `validateCoupon()` and
  the `<aside className="cart-summary">`.
- **Cause**: the summary renders `cart.subtotalCents/shippingCents/taxCents/
  totalCents`, which the server computed for the cart **without** the coupon;
  `validateCoupon()` only stores the coupon for display.
- **Approach**: reuse the backend pricing (`pricingService.calculateTotals`)
  shape — recompute shipping/tax/total locally after applying the discount, or
  have the backend return coupon-adjusted totals for the checkout preview.

### C08 — "Save profile" saves nothing
- **Location**: `frontend/src/pages/AccountPage.jsx` → `saveProfile()`.
- **Cause**: it only calls `toast(...)`; it never calls the API or reloads the
  user.
- **Approach**: wire it to `PATCH /users/me` (see `frontend/src/api/` and the
  `userService.updateMe` path) with `{ bio }`, then refresh the profile.

### C09 — Add to cart checks the wrong stock
- **Location**: `frontend/src/pages/ProductPage.jsx`.
- **Cause**: the disabled state and `<input max>` use `product.stock` even when
  a variant (`product.variants[...]`) is selected.
- **Approach**: expose variant-level inventory (backend currently includes
  `variants` without inventory) and use the selected variant's stock when one
  is chosen; fall back to product stock otherwise.

### C10 — Search box forgets the query
- **Location**: `frontend/src/pages/HomePage.jsx` → the `<input type="search">`.
- **Cause**: it uses `defaultValue`, so it stops syncing with the URL once
  mounted (e.g. after category filter + browser back).
- **Approach**: make it controlled from `q` (`value={q}` + `onChange`) so the
  box always reflects `useSearchParams`, or add a `key` that remounts it.

---

## Notes
- All four backend fixes have a matching failing test in
  `tests/integration/challenges.test.js`; fixing the code flips them green
  without editing the test.
- C01's planted bug touches `cartService.updateItem`; make sure the fix does not
  regress the existing (green) `cartService` behaviour used by checkout tests.
- C05's fix touches the same function as existing `B17` (wishlist remove).
  Confirm C05's fix does not accidentally "fix" or clash with B17's test.
