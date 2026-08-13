# ShopFlow — Challenge Board

A set of extra tasks for earning points. Each one targets a real flaw, a missing
feature, or an incorrect assumption somewhere in the code. Finding the exact
fix is part of the challenge — this board tells you **what** is wrong and roughly
**how hard** it is, but never the location or the steps. Go explore.

> The `C###` IDs are how you claim credit. When you fix one, keep the code you
> changed and the endpoint/component you touched clear in your submission.
>
> Backend challenges are often paired with a failing test in `backend/tests/`.
> The test is a good first clue. Don't edit the test to make it pass — fix the
> code instead.

Legend:
- **Type**: 🐛 bug fix · ⭐ feature build · ⚠️ correctness/assumption
- **Difficulty**: 1 (easiest) → 5 (hardest)
- **Points**: claim these from your instructor when a challenge is verified.

---

## Backend

### C01 — Cart lets you oversell on update 🐛 · diff 2 · 15 pts
Adding an item to the cart checks available stock. Updating that line's
quantity does not. You can push a quantity far above what's on the shelf and
check out happily.

`tests/integration/challenges.test.js` → `C01`.

### C02 — Cancelled orders keep the stock you bought 🐛 · diff 3 · 20 pts
When you cancel an order, the items you "reserved" are never returned to the
shelf. Inventory stays short even though nothing shipped.

`tests/integration/challenges.test.js` → `C02`.

### C03 — Sales report drops the "to" day entirely ⚠️ · diff 3 · 15 pts
Running a sales report "from today to today" returns nothing for today. An
order placed at 11:59pm on the end date is excluded from the window.

### C04 — Two default addresses ⚠️ · diff 2 · 15 pts
Marking a second address as default doesn't demote the previous default. A
customer can end up with several "default" addresses, which confuses checkout.

`tests/integration/challenges.test.js` → `C04`.

### C05 — Wishlist stores duplicate rows 🐛 · diff 2 · 15 pts
Saving the same product twice puts it on the wishlist twice. A wishlist should
never contain the same product for the same user more than once.

`tests/integration/challenges.test.js` → `C05`.

---

## Frontend

### C06 — Navbar shows no cart badge ⭐ · diff 3 · 25 pts
There's a shopping cart link, but no live count of what's in it. Build a small
count badge (e.g. the number of lines or items) that updates as the cart
changes, shown only for signed-in customers.

### C07 — Checkout summary ignores your coupon ⚠️ · diff 3 · 20 pts
Applying a coupon shows a discount line, but the shipping, tax and total in the
summary never change. These should reflect the coupon like the final order does.

### C08 — "Save profile" saves nothing 🐛 · diff 2 · 15 pts
The account page lets you edit a bio and hit **Save profile**, which always
reports success — and yet nothing is actually persisted or reloaded when you
come back.

### C09 — Add to cart checks the wrong stock 🐛 · diff 3 · 20 pts
On a product with variants, the button's stock check uses the *product's*
stock, not the selected variant's. A variant that's out of stock can still be
added (or blocked) using the wrong number.

### C10 — Search box forgets the current query ⚠️ · diff 2 · 15 pts
Type a search, apply a category filter, then use the browser back button. The
URL still holds your search but the box shows nothing, and it's easy to search
again starting from a blank box.

---

## Behaviour notes

- You may fix a challenge in any order.
- If two challenges touch the same file, that's fine — do them one at a time
  and keep each commit small so credit is easy to verify.
- A backend fix is "verified" when the corresponding test is green **and** the
  same behaviour holds by hand through the API/UI.
- A frontend fix is verified by running the app and showing the intended
  behaviour in the browser.

Good hunting.
