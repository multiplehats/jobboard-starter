# Payment System Data Flow

This document explains how product IDs and price IDs flow through the payment system, from environment variables to checkout session creation.

## Overview

The payment system uses a **configuration-driven architecture** where all pricing and provider mappings live in a single source of truth: `src/lib/config/products/config.server.ts`.

This configuration is dynamically populated from environment variables and consumed by the checkout service when creating payment sessions.

## Complete Data Flow

### 1. Environment Variables (`.env`)

First, you configure your payment provider credentials and product/price IDs in `.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PRODUCT_JOB_POSTING_BASE="prod_ABC123"
STRIPE_PRICE_JOB_POSTING_BASE="price_DEF456"
STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER="prod_GHI789"
STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER="price_JKL012"

# Polar Configuration
POLAR_API_KEY="polar_at_..."
POLAR_PRODUCT_JOB_POSTING_BASE="prod_XYZ123"
POLAR_PRICE_JOB_POSTING_BASE="price_UVW456"
POLAR_PRODUCT_UPSELL_EMAIL_NEWSLETTER="prod_RST789"
POLAR_PRICE_UPSELL_EMAIL_NEWSLETTER="price_OPQ012"
```

**How to get these values:**
- Run `pnpm run payments:sync` (for Stripe)
- Run `pnpm run payments:sync:polar` (for Polar)
- Copy the generated product/price IDs to your `.env` file

### 2. Products Config (`src/lib/config/products/config.server.ts`)

The products config imports environment variables and conditionally adds provider mappings:

```typescript
import { env } from '$env/dynamic/private';

export const DEFAULT_PRODUCTS_CONFIG: ProductsConfig = {
  jobPosting: {
    // Core pricing (provider-agnostic)
    price: 9900,        // $99.00 in cents
    currency: 'USD',
    duration: 30,       // days

    // Display (optional - uses i18n if not provided)
    name: 'Job Posting',
    description: '30-day job listing',

    // Provider mappings (conditionally added based on env vars)
    ...(env.STRIPE_PRODUCT_JOB_POSTING_BASE && {
      stripe: {
        productId: env.STRIPE_PRODUCT_JOB_POSTING_BASE,
        priceId: env.STRIPE_PRICE_JOB_POSTING_BASE || ''
      }
    }),

    ...(env.POLAR_PRODUCT_JOB_POSTING_BASE && {
      polar: {
        productId: env.POLAR_PRODUCT_JOB_POSTING_BASE,
        priceId: env.POLAR_PRICE_JOB_POSTING_BASE || ''
      }
    })
  },

  upsells: [
    {
      id: 'email_newsletter',
      price: 5000,      // $50.00 in cents
      enabled: true,

      // Provider mappings (same pattern)
      ...(env.STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER && {
        stripe: {
          productId: env.STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER,
          priceId: env.STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER || ''
        }
      }),

      ...(env.POLAR_PRODUCT_UPSELL_EMAIL_NEWSLETTER && {
        polar: {
          productId: env.POLAR_PRODUCT_UPSELL_EMAIL_NEWSLETTER,
          priceId: env.POLAR_PRICE_UPSELL_EMAIL_NEWSLETTER || ''
        }
      })
    }
  ],

  payment: {
    // Auto-detect default provider based on which env vars are present
    // Priority: Polar > Stripe
    defaultProvider: env.POLAR_API_KEY ? 'polar' : 'stripe',
    webhooks: {
      verifySignature: true,
      logEvents: true
    }
  }
};
```

**Key Points:**
- Uses `$env/dynamic/private` for server-side environment variable access
- Uses spread operator (`...`) for conditional provider mappings
- Only includes provider config if the corresponding env var exists
- Auto-detects default provider (Polar priority over Stripe)

### 3. Checkout Service (`src/lib/features/payments/server/checkout.ts`)

The checkout service consumes the products config to create checkout sessions:

```typescript
import { getProductsConfig } from '$lib/config/products';

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  // Get config with provider mappings
  const config = getProductsConfig();

  // Use default provider or override
  const provider = params.provider || config.payment?.defaultProvider || 'stripe';

  // Get order from database
  const order = await paymentsRepository.findOrderById(params.orderId);

  // Convert order items to provider line items
  const lineItems = orderToLineItems(order, provider);

  // Get payment adapter
  const paymentSystem = getPaymentSystem();
  const adapter = paymentSystem.getAdapter(provider);

  // Create checkout session via adapter
  const session = await adapter.createCheckoutSession({
    lineItems,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    metadata: { orderId: order.id, userId: order.userId }
  });

  return session;
}

function orderToLineItems(order: Order, provider: string): LineItem[] {
  const config = getProductsConfig();
  const lineItems: LineItem[] = [];

  for (const item of order.items) {
    let priceId: string | undefined;

    if (item.productId === 'job_posting_base') {
      // Get price ID from provider mapping
      priceId = (config.jobPosting as any)[provider]?.priceId;
    } else {
      // Check upsells
      const upsell = config.upsells.find((u) => u.id === item.productId);
      if (upsell) {
        priceId = (upsell as any)[provider]?.priceId;
      }
    }

    if (!priceId) {
      throw new Error(
        `Price ID not configured for ${item.productId} on provider ${provider}`
      );
    }

    lineItems.push({ priceId, quantity: item.quantity });
  }

  return lineItems;
}
```

**Key Points:**
- Calls `getProductsConfig()` to get the config with env vars
- Looks up provider-specific price IDs: `config.jobPosting[provider].priceId`
- Throws error if price ID not found (prevents silent failures)
- Passes price IDs to payment adapter

### 4. Payment Adapter (Stripe/Polar)

The adapter uses the price IDs to create checkout sessions:

**Stripe:**
```typescript
async createCheckoutSession(params: CheckoutSessionParams) {
  const session = await this.stripe.checkout.sessions.create({
    line_items: params.lineItems.map(item => ({
      price: item.priceId,  // Uses Stripe price ID
      quantity: item.quantity
    })),
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata
  });

  return { sessionId: session.id, url: session.url };
}
```

**Polar:**
```typescript
async createCheckoutSession(params: CheckoutSessionParams) {
  const checkoutSession = await this.polar.checkouts.custom.create({
    productPrices: params.lineItems.map(item => ({
      productPriceId: item.priceId,  // Uses Polar price ID
      quantity: item.quantity
    })),
    successUrl: params.successUrl,
    metadata: {
      ...params.metadata,
      cancelUrl: params.cancelUrl
    }
  });

  return { sessionId: checkoutSession.id, url: checkoutSession.url };
}
```

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Environment Variables (.env)                             │
├─────────────────────────────────────────────────────────────┤
│ STRIPE_PRICE_JOB_POSTING_BASE="price_ABC123"                │
│ POLAR_PRICE_JOB_POSTING_BASE="price_XYZ789"                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Imported by
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Products Config (config.server.ts)                       │
├─────────────────────────────────────────────────────────────┤
│ import { env } from '$env/dynamic/private';                 │
│                                                              │
│ DEFAULT_PRODUCTS_CONFIG = {                                 │
│   jobPosting: {                                             │
│     price: 9900,                                            │
│     ...(env.STRIPE_PRICE_JOB_POSTING_BASE && {              │
│       stripe: { priceId: env.STRIPE_PRICE_... }             │
│     }),                                                      │
│     ...(env.POLAR_PRICE_JOB_POSTING_BASE && {               │
│       polar: { priceId: env.POLAR_PRICE_... }               │
│     })                                                       │
│   }                                                          │
│ }                                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Called by
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Checkout Service (checkout.ts)                           │
├─────────────────────────────────────────────────────────────┤
│ const config = getProductsConfig();                         │
│ const provider = 'stripe'; // or 'polar'                    │
│                                                              │
│ // Get price ID from config                                 │
│ const priceId = config.jobPosting[provider].priceId;        │
│ // → "price_ABC123" (for Stripe)                            │
│ // → "price_XYZ789" (for Polar)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Passes to
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Payment Adapter (stripe.ts / polar.ts)                   │
├─────────────────────────────────────────────────────────────┤
│ await stripe.checkout.sessions.create({                     │
│   line_items: [                                             │
│     { price: "price_ABC123", quantity: 1 }  ← Price ID!     │
│   ]                                                          │
│ })                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Multiple Provider Support

The system supports using **both Stripe and Polar simultaneously**:

### Configuration

```typescript
jobPosting: {
  price: 9900,

  // Both providers configured
  stripe: {
    productId: env.STRIPE_PRODUCT_JOB_POSTING_BASE,
    priceId: env.STRIPE_PRICE_JOB_POSTING_BASE
  },
  polar: {
    productId: env.POLAR_PRODUCT_JOB_POSTING_BASE,
    priceId: env.POLAR_PRICE_JOB_POSTING_BASE
  }
},

payment: {
  defaultProvider: 'polar'  // Default choice
}
```

### Usage

Users can specify which provider to use when creating an order:

```typescript
// Use default provider (Polar)
const result = await createOrderRemote({
  items: [...],
  successUrl: '...',
  cancelUrl: '...'
});

// Override with Stripe
const result = await createOrderRemote({
  items: [...],
  successUrl: '...',
  cancelUrl: '...',
  provider: 'stripe'  // Explicit override
});
```

## Error Handling

The system throws clear errors when price IDs are missing:

```typescript
if (!priceId) {
  throw new Error(
    `Price ID not configured for ${item.productId} on provider ${provider}. ` +
    `Please configure the ${provider} price ID in your products config.`
  );
}
```

**Common causes:**
1. Forgot to run sync script (`pnpm run payments:sync` or `pnpm run payments:sync:polar`)
2. Didn't copy product/price IDs to `.env`
3. Didn't restart dev server after updating `.env`

## Setup Checklist

To ensure the data flow works correctly:

- [ ] Run sync script for your provider(s)
  - Stripe: `pnpm run payments:sync`
  - Polar: `pnpm run payments:sync:polar`
- [ ] Copy generated product/price IDs to `.env`
- [ ] Verify env vars are present in `.env`:
  - `STRIPE_PRODUCT_JOB_POSTING_BASE`
  - `STRIPE_PRICE_JOB_POSTING_BASE`
  - `POLAR_PRODUCT_JOB_POSTING_BASE`
  - `POLAR_PRICE_JOB_POSTING_BASE`
- [ ] Restart dev server to load new env vars
- [ ] Test checkout flow end-to-end
- [ ] Verify price IDs match in payment provider dashboard

## Debugging

### Check if env vars are loaded:

```typescript
// In config.server.ts (temporarily)
console.log('Stripe Price ID:', env.STRIPE_PRICE_JOB_POSTING_BASE);
console.log('Polar Price ID:', env.POLAR_PRICE_JOB_POSTING_BASE);
```

### Check if config has provider mappings:

```typescript
// In checkout.ts (temporarily)
const config = getProductsConfig();
console.log('Job Posting Config:', config.jobPosting);
console.log('Stripe mapping:', config.jobPosting.stripe);
console.log('Polar mapping:', config.jobPosting.polar);
```

### Check price ID lookup:

```typescript
// In orderToLineItems function (temporarily)
console.log('Looking up price for provider:', provider);
console.log('Found price ID:', priceId);
```

## Related Documentation

- [Payment Setup Guide](./payments-setup.md) - Complete setup walkthrough
- [Stripe Setup](./payments-setup.md#stripe-setup) - Stripe-specific setup
- [Polar Setup](./polar-setup.md) - Polar-specific setup
- [Backend Architecture](./backend-architecture.md) - System architecture overview

---

**Summary:** Environment variables → Products Config → Checkout Service → Payment Adapter → Provider API
