# Payment System Implementation Plan - Master Document

**Status**: Ready for Implementation
**Created**: 2025-11-21
**No Backward Compatibility Needed**: We haven't launched yet!

---

## Overview

This is the master document for implementing the payment system. Read this first, then dive into specific plans.

---

## The Three Planning Documents

### 1. ⭐ **Unified Products Config** (`unified-products-config-plan.md`)

**Read This First!**

Explains how we're merging the pricing config and payment config into ONE source of truth.

**Key Points**:

- Eliminates duplication
- One config file: `src/lib/config/products/products.config.ts`
- Serves both payment backend AND display frontend
- Includes provider mappings (Stripe product/price IDs)
- CLI tool to sync everything

**Why This Matters**: Prevents users from editing prices in two places and getting confused.

### 2. 🏗️ **Payment System v2** (`payment-system-v2-plan.md`)

**The Full Implementation Guide**

Complete architecture and code examples for the payment system.

**Key Points**:

- 3 layers (not 5) - simpler architecture
- 2 database tables (not 6+) - `orders` and `payments` only
- Job postings only in v1 (subscriptions/credits later)
- Config-driven, event-based, merge-friendly
- Realistic 3-week timeline with phases

**What's Different from Original**:

- ✅ No `job_payments` table (payment ref in `jobs` table)
- ✅ No ProductRegistry class (reads from products config)
- ✅ No hardcoded products (all in config)
- ✅ No enums (text fields for easier migrations)
- ✅ Event handlers instead of switch statements

### 3. 📊 **Issues Analysis** (in conversation history)

**Why We Changed The Plan**

Documents all 14 critical issues found in the original architecture.

**Highlights**:

- Too complex for a starter (5 layers → 3 layers)
- Hardcoded products in code → products in config
- Merge conflicts everywhere → clear boundaries
- Missing edge cases → documented solutions

---

## What We're Building

### Single Source of Truth

**File**: `src/lib/config/products/products.config.ts`

```typescript
export const productsConfig = {
  jobPosting: {
    price: 9900,      // $99 in cents
    currency: 'USD',
    duration: 30,     // days

    // Provider mappings
    stripe: {
      productId: env.STRIPE_PRODUCT_JOB_POSTING,
      priceId: env.STRIPE_PRICE_JOB_POSTING
    }
  },

  upsells: [
    {
      id: 'email_newsletter',  // Predefined - auto i18n
      price: 4900,              // $49 in cents
      enabled: true,
      badge: 'Popular',

      stripe: {
        productId: env.STRIPE_PRODUCT_EMAIL_NEWSLETTER,
        priceId: env.STRIPE_PRICE_EMAIL_NEWSLETTER
      }
    }
  ]
}
```

This ONE config is used by:

- ✅ Payment system (checkout, webhooks)
- ✅ Display layer (job posting form)
- ✅ CLI sync tool (Stripe sync)
- ✅ i18n system (translations)

### Simple Database Schema

**Two tables only:**

```typescript
// orders - purchase intent
export const orders = pgTable('orders', {
  id, userId, items, totalAmount, currency, status,
  provider, providerSessionId,
  metadata, // Stores job IDs, upsells, etc.
  createdAt, updatedAt, completedAt
});

// payments - transactions
export const payments = pgTable('payments', {
  id, orderId, provider, providerPaymentId,
  amount, currency, status,
  metadata,
  createdAt, updatedAt, completedAt
});
```

**Jobs table gets payment reference:**

```typescript
// Add to existing jobs table
paymentId: text('payment_id').references(() => payments.id),
paidAmount: integer('paid_amount'),
selectedUpsells: json('selected_upsells').$type<string[]>() // Already exists!
```

**That's it!** No `job_payments` junction table needed.

---

## Implementation Timeline

### Week 1: Foundation

- [ ] Migrate `pricing/` → `products/` config
- [ ] Add provider mappings to schema
- [ ] Implement payment types
- [ ] Build Stripe adapter
- [ ] Update database schema
- [ ] Run migrations

### Week 2: Core System

- [ ] Implement checkout service
- [ ] Build webhook handling
- [ ] Create payment handlers
- [ ] Add idempotency checks
- [ ] Test with Stripe CLI

### Week 3: Routes & Tools

- [ ] API routes (checkout, webhooks)
- [ ] Admin UI (orders page)
- [ ] CLI sync tool
- [ ] Documentation
- [ ] E2E testing

---

## Migration Steps (From Current State)

### Step 1: Config Migration

```bash
# Rename directory
mv src/lib/config/pricing src/lib/config/products

# Update all imports
find src -type f -name "*.ts" -o -name "*.svelte" | \
  xargs sed -i '' 's/config\/pricing/config\/products/g'
```

### Step 2: Update Schema

Add provider mappings to schema (see `unified-products-config-plan.md`)

### Step 3: Convert Dollars to Cents

```diff
- basePriceUSD: 99
+ price: 9900  // in cents
```

### Step 4: Add Provider Mappings

```typescript
stripe: {
  productId: env.STRIPE_PRODUCT_JOB_POSTING,
  priceId: env.STRIPE_PRICE_JOB_POSTING
}
```

### Step 5: Database Migrations

```bash
# Generate migration for new tables
pnpm run db:generate

# Review migration, then push
pnpm run db:push
```

### Step 6: Implement Payment System

Follow `payment-system-v2-plan.md` phases 1-3.

---

## User Workflow (After Implementation)

### 1. Configure Products

Edit `src/lib/config/products/products.config.ts`:

```typescript
export const productsConfig = {
  jobPosting: {
    price: 14900,  // Change to $149
    // ... rest
  },
  upsells: [
    // Add/remove/edit upsells
  ]
}
```

### 2. Sync to Stripe

```bash
pnpm run products:sync
```

Outputs:

```
✅ Job Posting: prod_xxx / price_xxx
   STRIPE_PRODUCT_JOB_POSTING=prod_xxx
   STRIPE_PRICE_JOB_POSTING=price_xxx

✅ email_newsletter: prod_yyy / price_yyy
   STRIPE_PRODUCT_EMAIL_NEWSLETTER=prod_yyy
   STRIPE_PRICE_EMAIL_NEWSLETTER=price_yyy
```

### 3. Add to .env

Copy environment variables from sync output.

### 4. Test

```bash
pnpm run products:test  # Test webhook handling
```

### 5. Deploy

Everything works! 🎉

---

## Benefits of This Approach

### For Users (Starter Kit Buyers)

✅ **One config file** - Edit `products.config.ts`, everything updates
✅ **Simple to understand** - 3 layers, 2 tables, clear boundaries
✅ **Easy to customize** - Marked CORE vs USER CUSTOMIZES
✅ **Merge-friendly** - Upstream updates won't conflict
✅ **CLI tools** - Sync, test, generate with one command

### For Us (Maintainers)

✅ **Less support burden** - Fewer things to go wrong
✅ **Easy to extend** - Add new providers, product types
✅ **Well tested** - Each layer independently testable
✅ **Good docs** - Everything documented

---

## File Structure Summary

### User Customizes (Won't Conflict with Upstream)

```
src/lib/config/products/
└── products.config.ts         ← Edit prices, upsells, providers

src/lib/payments-setup.ts      ← Optional: custom payment hooks
```

### Upstream Maintains (Users Don't Touch)

```
src/lib/config/products/
├── schema.server.ts           ← Validation schema
├── constants.server.ts        ← Predefined upsell IDs
├── i18n.ts                    ← i18n enrichment
└── index.ts                   ← Barrel export

src/lib/features/payments/
├── types.ts                   ← Type definitions
├── system.server.ts           ← PaymentSystem class
├── checkout.server.ts         ← Checkout creation
├── webhooks.server.ts         ← Webhook handling
├── handlers.server.ts         ← Default handlers
└── adapters/
    ├── adapter.ts             ← Interface
    └── stripe.server.ts       ← Stripe implementation

src/lib/server/db/schema/
└── payments.ts                ← Database schema

src/routes/api/
├── checkout/+server.ts        ← Create checkout sessions
└── webhooks/[provider]/+server.ts  ← Webhook endpoint

scripts/products/
└── sync.ts                    ← Sync to Stripe CLI tool
```

---

## Next Steps

1. **Read** `unified-products-config-plan.md` (understand the config merge)
2. **Read** `payment-system-v2-plan.md` (understand the implementation)
3. **Start** with Week 1 tasks (config migration + foundation)
4. **Test** each phase before moving to next
5. **Document** any deviations from the plan

---

## Questions to Resolve Before Starting

- [ ] Which payment provider first? (Stripe recommended)
- [ ] Keep DodoPayments support or just Stripe for v1?
- [ ] Admin UI required in v1 or can be v2?
- [ ] What's the staging/testing environment setup?

---

## Success Criteria

### Phase 1 Complete When:

- [ ] Config migrated from `pricing/` to `products/`
- [ ] Provider mappings in schema
- [ ] Database tables created
- [ ] Stripe adapter working
- [ ] Tests passing

### Phase 2 Complete When:

- [ ] Can create checkout sessions
- [ ] Webhooks process correctly
- [ ] Jobs publish after payment
- [ ] Refunds work
- [ ] Idempotency tested

### Phase 3 Complete When:

- [ ] API routes functional
- [ ] Admin UI displays orders
- [ ] CLI sync tool works
- [ ] Documentation complete
- [ ] E2E tests passing

### Ready for Production When:

- [ ] All phases complete
- [ ] Security review done
- [ ] Error handling robust
- [ ] Monitoring in place
- [ ] Stripe webhook configured in production

---

## Support & References

- **Implementation Details**: `payment-system-v2-plan.md`
- **Config Strategy**: `unified-products-config-plan.md`
- **Current Pricing Docs**: `PRICING_CONFIG.md` (will be updated)
- **Current Payment Docs**: `PAYMENT_ARCHITECTURE.md` (superseded by v2)
- **Stripe Docs**: https://docs.stripe.com/llms.txt
- **DodoPayments Docs**: https://docs.dodopayments.com/llms-full.txt
- **SvelteKit Docs**: https://svelte.dev/docs/kit/llms-small.txt

---

## Notes

- ✅ No backward compatibility needed (not launched yet)
- ✅ Can remove any tables/code that adds complexity
- ✅ Focus on simplicity over features
- ✅ Job postings only in v1, extend later
- ✅ Config-driven, not code-driven
- ✅ Merge-friendly for upstream updates

---

**Ready to build a simple, powerful, starter-friendly payment system! 🚀**
