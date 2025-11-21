# Payment Setup Guide

Complete guide to setting up and customizing the payment system for your job board.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Configuration](#configuration)
- [Stripe Setup](#stripe-setup)
- [Testing](#testing)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

---

## Overview

The payment system is a configuration-driven, hook-based architecture that handles:

- Job posting payments with upsells
- Multiple payment providers (Stripe, with support for more)
- Webhook processing for payment lifecycle events
- Order and payment tracking
- Automatic job publishing on successful payment

### Architecture Layers

1. **Configuration Layer** - Products, pricing, and provider mappings (`src/lib/config/products/`)
2. **Payment Core** - Core payment logic, adapters, and handlers (`src/lib/features/payments/`)
3. **Database Layer** - Orders and payments schema (`src/lib/server/db/schema/payments.ts`)
4. **Routes Layer** - Webhooks and checkout flows

### Key Features

- **Configuration Over Code** - Customize pricing without touching core code
- **Hook-Based Events** - Register custom handlers for payment lifecycle events
- **Multiple Providers** - Adapter pattern supports multiple payment providers
- **Type-Safe** - End-to-end TypeScript with Zod validation
- **Webhook Security** - Automatic signature verification for all webhooks

---

## Quick Start

Follow these steps to get your payment system up and running:

### Step 1: Configure Products and Pricing

Edit `src/lib/config/products/config.server.ts`:

```typescript
export const DEFAULT_PRODUCTS_CONFIG: ProductsConfig = {
  jobPosting: {
    // Pricing (in cents!)
    price: 9900,      // $99.00
    currency: 'USD',
    duration: 30,     // days

    // Display
    name: 'Job Posting',
    description: '30-day job listing'
  },

  upsells: [
    {
      id: 'email_newsletter',  // Predefined ID
      price: 5000,             // $50.00 in cents
      enabled: true
    },
    {
      id: 'my_custom_upsell',  // Custom ID
      name: 'Premium Badge',   // Required for custom IDs
      description: 'Stand out with a premium badge',
      price: 2500,             // $25.00
      enabled: true
    }
  ],

  payment: {
    defaultProvider: 'stripe',
    webhooks: {
      verifySignature: true,
      logEvents: true
    }
  }
};
```

**Important Notes:**
- All prices are in **cents**, not dollars (e.g., 9900 = $99.00)
- Predefined upsell IDs (like `email_newsletter`) get name/description from i18n automatically
- Custom upsell IDs require `name` and `description` in the config
- See `src/lib/config/products/constants.server.ts` for available predefined IDs

### Step 2: Sync Products to Stripe

Run the sync script to create products and prices in Stripe:

```bash
pnpm run payments:sync
```

This will:
1. Create products in your Stripe account
2. Create price objects for each product
3. Output environment variables you need to add

Example output:
```
Creating job posting base product...
 Job Posting: prod_ABC123 / price_XYZ789
   Add to .env:
   STRIPE_PRODUCT_JOB_POSTING_BASE=prod_ABC123
   STRIPE_PRICE_JOB_POSTING_BASE=price_XYZ789

Creating upsell: email_newsletter...
 email_newsletter: prod_DEF456 / price_UVW012
   Add to .env:
   STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER=prod_DEF456
   STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER=price_UVW012
```

### Step 3: Update Environment Variables

Copy the output from the sync command and add it to your `.env` file:

```bash
# Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Product IDs (from sync command)
STRIPE_PRODUCT_JOB_POSTING_BASE=prod_ABC123
STRIPE_PRICE_JOB_POSTING_BASE=price_XYZ789
STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER=prod_DEF456
STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER=price_UVW012
```

### Step 4: Update Products Config with Stripe IDs

Now update your `config.server.ts` to include the Stripe mappings:

```typescript
import { env } from '$env/dynamic/private';

export const DEFAULT_PRODUCTS_CONFIG: ProductsConfig = {
  jobPosting: {
    price: 9900,
    currency: 'USD',
    duration: 30,
    name: 'Job Posting',
    description: '30-day job listing',

    // Add Stripe mapping
    stripe: {
      productId: env.STRIPE_PRODUCT_JOB_POSTING_BASE || '',
      priceId: env.STRIPE_PRICE_JOB_POSTING_BASE || ''
    }
  },

  upsells: [
    {
      id: 'email_newsletter',
      price: 5000,
      enabled: true,

      // Add Stripe mapping
      stripe: {
        productId: env.STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER || '',
        priceId: env.STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER || ''
      }
    }
  ]
};
```

### Step 5: Set Up Stripe Webhooks

See [Stripe Setup](#stripe-setup) section below for detailed webhook configuration.

### Step 6: Test

Test your payment flow locally using the Stripe CLI:

```bash
# Install Stripe CLI if not already installed
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:5173/api/webhooks/stripe
```

Then test a payment flow in your application.

---

## Environment Variables

### Required Variables

```bash
# Stripe Configuration (Required)
STRIPE_SECRET_KEY=sk_test_...          # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signing secret

# Database (Required)
DATABASE_URL=postgres://...             # Your PostgreSQL connection string
```

### Product Configuration Variables

These are generated by `pnpm run payments:sync`:

```bash
# Base Job Posting
STRIPE_PRODUCT_JOB_POSTING_BASE=prod_...
STRIPE_PRICE_JOB_POSTING_BASE=price_...

# Upsells (one pair per upsell)
STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER=prod_...
STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER=price_...

STRIPE_PRODUCT_UPSELL_FEATURED=prod_...
STRIPE_PRICE_UPSELL_FEATURED=price_...
```

### Where to Find Stripe Keys

1. **STRIPE_SECRET_KEY**
   - Dashboard: https://dashboard.stripe.com/test/apikeys
   - Use test key (starts with `sk_test_`) for development
   - Use live key (starts with `sk_live_`) for production

2. **STRIPE_WEBHOOK_SECRET**
   - Dashboard: https://dashboard.stripe.com/test/webhooks
   - Create endpoint first, then copy the signing secret
   - Format: `whsec_...`

---

## Configuration

### Products Config Structure

Location: `src/lib/config/products/config.server.ts`

```typescript
export const DEFAULT_PRODUCTS_CONFIG: ProductsConfig = {
  // Base job posting product
  jobPosting: {
    price: number,           // Price in cents (9900 = $99.00)
    currency: string,        // 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'
    duration: number,        // Duration in days (30 = 30 days)
    name?: string,          // Optional: defaults to i18n
    description?: string,   // Optional: defaults to i18n
    stripe?: {              // Optional: required for Stripe payments
      productId: string,
      priceId: string
    },
    dodopayments?: {        // Optional: for future provider support
      productId: string,
      priceId: string
    }
  },

  // Upsells array
  upsells: [
    {
      id: string,           // Predefined or custom ID
      enabled: boolean,     // Whether this upsell is available
      price: number,        // Price in cents
      name?: string,       // Required for custom IDs
      description?: string, // Required for custom IDs
      badge?: string,      // Optional badge text (e.g., "Popular")
      stripe?: {           // Optional: required for Stripe payments
        productId: string,
        priceId: string
      }
    }
  ],

  // Payment settings
  payment?: {
    defaultProvider: 'stripe' | 'dodopayments',
    webhooks?: {
      verifySignature: boolean,  // Always true in production
      logEvents: boolean         // For debugging
    }
  }
};
```

### Predefined Upsell IDs

These IDs have backend support and i18n translations:

- `email_newsletter` - Featured in email newsletter
- `featured` - Featured job listing
- `highlighted` - Highlighted with color
- `company_logo` - Display company logo

Location: `src/lib/config/products/constants.server.ts`

### Custom Upsell IDs

You can create custom upsells with any ID:

```typescript
{
  id: 'my_premium_package',
  name: 'Premium Package',           // Required for custom IDs
  description: 'Get maximum visibility',
  price: 9900,
  enabled: true
}
```

**Note:** Custom upsells won't have automatic backend behavior. You'll need to add custom handlers (see [Customization](#customization)).

### Config Helper Functions

The config module provides helper utilities:

```typescript
import {
  getProductsConfig,
  UpsellHelpers
} from '$lib/config/products';

// Get current config
const config = getProductsConfig();

// Check if upsell is enabled
UpsellHelpers.isUpsellEnabled('email_newsletter');

// Get specific upsell
const upsell = UpsellHelpers.getUpsell('featured');

// Get all enabled upsells
const enabled = UpsellHelpers.getEnabledUpsells();

// Get enabled predefined upsells only
const predefined = UpsellHelpers.getEnabledPredefinedUpsells();
```

---

## Stripe Setup

### 1. Create Stripe Account

1. Sign up at https://stripe.com
2. Activate your account
3. Get your test API keys from https://dashboard.stripe.com/test/apikeys

### 2. Run Product Sync

```bash
pnpm run payments:sync
```

This creates products and prices in Stripe and outputs the required environment variables.

### 3. Configure Webhook Endpoint

#### Production Setup

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the signing secret (starts with `whsec_`)
6. Add to your `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret
   ```

#### Development Setup (Stripe CLI)

For local development, use the Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:5173/api/webhooks/stripe
```

The CLI will output a webhook signing secret. Add it to your `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Webhook URL Pattern

The payment system supports multiple providers via dynamic routes:

```
POST /api/webhooks/[provider]
```

Examples:
- Stripe: `POST /api/webhooks/stripe`
- Future providers: `POST /api/webhooks/dodopayments`

The webhook handler automatically:
- Verifies signature via provider adapter
- Parses webhook event
- Routes to appropriate handler
- Updates database
- Emits events to custom handlers

---

## Testing

### Local Testing with Stripe CLI

1. **Start your dev server:**
   ```bash
   pnpm run dev
   ```

2. **In another terminal, forward webhooks:**
   ```bash
   stripe listen --forward-to http://localhost:5173/api/webhooks/stripe
   ```

3. **Test the payment flow:**
   - Navigate to your job posting form
   - Fill in job details and select upsells
   - Click "Post Job" to create an order
   - Complete checkout with Stripe test card: `4242 4242 4242 4242`
   - Watch webhook events in the Stripe CLI terminal

4. **Verify the results:**
   - Check that order status changed to `paid`
   - Check that job was published
   - Check that upsells were applied

### Test Cards

Stripe provides test cards for different scenarios:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0025 0000 3155` | Requires authentication |

Use any future expiration date, any 3-digit CVC, and any postal code.

### Triggering Test Webhooks

You can manually trigger webhook events:

```bash
# Trigger successful payment
stripe trigger checkout.session.completed

# Trigger failed payment
stripe trigger payment_intent.payment_failed

# Trigger refund
stripe trigger charge.refunded
```

### Webhook Event Logs

Check webhook delivery in Stripe Dashboard:
- Test mode: https://dashboard.stripe.com/test/webhooks
- Live mode: https://dashboard.stripe.com/webhooks

Look for:
- Response status (should be 200)
- Response time
- Webhook attempts and retries

### Database Verification

Check your database after payments:

```sql
-- Check orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Check payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check published jobs
SELECT id, title, status, published_at, selected_upsells
FROM jobs
WHERE status = 'published'
ORDER BY published_at DESC;
```

---

## Customization

The payment system is designed for customization via hooks, not code modification.

### Adding Custom Payment Handlers

Create a custom initialization file (e.g., `src/lib/payments-setup.ts`):

```typescript
import { getPaymentSystem } from '$lib/features/payments/server/system';
import type { PaymentContext } from '$lib/features/payments/types';

export function setupCustomPaymentHandlers() {
  const paymentSystem = getPaymentSystem();

  // Handle successful payments
  paymentSystem.on('payment.succeeded', async (ctx: PaymentContext) => {
    console.log('Custom handler: payment succeeded', ctx.order.id);

    // Example: Send confirmation email
    await sendPaymentConfirmationEmail(ctx.order, ctx.payment);

    // Example: Track analytics event
    await trackEvent('job_payment_succeeded', {
      orderId: ctx.order.id,
      amount: ctx.payment.amount
    });
  });

  // Handle failed payments
  paymentSystem.on('payment.failed', async (ctx: PaymentContext) => {
    console.log('Custom handler: payment failed', ctx.order.id);

    // Example: Send notification email
    await sendPaymentFailedEmail(ctx.order);
  });

  // Handle refunds
  paymentSystem.on('payment.refunded', async (ctx: PaymentContext) => {
    console.log('Custom handler: payment refunded', ctx.order.id);

    // Example: Send refund confirmation
    await sendRefundConfirmationEmail(ctx.order, ctx.payment);
  });
}
```

Then register your handlers in `src/hooks.server.ts`:

```typescript
import { initPaymentSystem } from '$lib/features/payments/server/init';
import { setupCustomPaymentHandlers } from '$lib/payments-setup';

// Initialize default payment system
initPaymentSystem();

// Register custom handlers
setupCustomPaymentHandlers();
```

### Payment Context

Each handler receives a `PaymentContext` object:

```typescript
interface PaymentContext {
  event: {
    id: string;           // Provider event ID
    type: string;         // Provider event type
    provider: string;     // 'stripe', 'dodopayments', etc.
    data: any;           // Raw provider data
    metadata: any;       // Event metadata
  };
  order: Order;          // Order object from database
  payment: Payment;      // Payment object from database (null for failed payments)
  provider: string;      // Payment provider name
}
```

### Custom Upsell Logic

For custom upsell IDs, you need to implement the logic:

```typescript
paymentSystem.on('payment.succeeded', async (ctx: PaymentContext) => {
  const { order } = ctx;
  const upsells = order.metadata?.upsells as string[] || [];

  // Check for your custom upsell
  if (upsells.includes('my_premium_package')) {
    // Implement your custom logic
    await applyPremiumPackage(order);
  }
});
```

### Adding New Payment Providers

1. **Create adapter** (`src/lib/features/payments/server/adapters/myprovider.ts`):

```typescript
import type { PaymentAdapter } from './adapter';

export class MyProviderAdapter implements PaymentAdapter {
  readonly name = 'myprovider';

  async createCheckoutSession(params) {
    // Implementation
  }

  async verifyWebhook(request) {
    // Implementation
  }

  async parseWebhook(request) {
    // Implementation
  }

  async refund(params) {
    // Implementation
  }
}
```

2. **Register adapter** in `src/lib/features/payments/server/system.ts`:

```typescript
private registerDefaultAdapters() {
  this.registerAdapter(new StripeAdapter());
  this.registerAdapter(new MyProviderAdapter());  // Add this
}
```

3. **Update event normalization** in `src/lib/features/payments/server/webhooks.ts`:

```typescript
export function normalizeEventType(eventType: string, provider: string): string {
  if (provider === 'stripe') {
    // Stripe mappings...
  }

  if (provider === 'myprovider') {
    const mapping: Record<string, string> = {
      'payment.completed': 'payment.succeeded',
      'payment.cancelled': 'payment.failed',
      // Add more mappings
    };
    return mapping[eventType] || eventType;
  }

  return eventType;
}
```

4. **Add provider configuration** to products config:

```typescript
jobPosting: {
  price: 9900,
  // ...
  myprovider: {
    productId: env.MYPROVIDER_PRODUCT_ID || '',
    priceId: env.MYPROVIDER_PRICE_ID || ''
  }
}
```

### Custom Order Creation Logic

Override order creation in a remote function:

```typescript
// src/lib/features/payments/actions/create-custom-order.remote.ts
import { createOrder } from '$lib/features/payments/server/mutations';
import type { CreateOrderParams } from '$lib/features/payments/validators';

export async function createCustomOrder(params: CreateOrderParams) {
  // Add custom validation
  if (params.totalAmount > 100000) {
    throw new Error('Order amount too high - requires manual approval');
  }

  // Create order with custom metadata
  const order = await createOrder({
    ...params,
    metadata: {
      ...params.metadata,
      customField: 'custom value',
      processedAt: new Date().toISOString()
    }
  });

  // Custom post-creation logic
  await notifyAdminOfLargeOrder(order);

  return order;
}
```

---

## Troubleshooting

### Webhook Signature Verification Fails

**Problem:** Getting "Invalid webhook signature" error

**Solutions:**

1. Check that `STRIPE_WEBHOOK_SECRET` is set correctly
   ```bash
   # Should start with whsec_
   echo $STRIPE_WEBHOOK_SECRET
   ```

2. For local development, make sure Stripe CLI is running:
   ```bash
   stripe listen --forward-to http://localhost:5173/api/webhooks/stripe
   ```

3. In production, verify webhook endpoint URL in Stripe Dashboard matches exactly

4. Check webhook secret is from the correct environment (test vs live)

### Products Not Created in Stripe

**Problem:** `pnpm run payments:sync` fails

**Solutions:**

1. Check Stripe secret key is set:
   ```bash
   echo $STRIPE_SECRET_KEY
   ```

2. Verify you're using the test key (starts with `sk_test_`) for development

3. Check network connection to Stripe API

4. View full error in console output

### Payment Succeeds but Job Not Published

**Problem:** Payment completes but job stays in draft status

**Solutions:**

1. Check webhook was received:
   ```bash
   # In Stripe Dashboard > Webhooks
   # Look for checkout.session.completed event
   ```

2. Check webhook handler logs:
   ```bash
   # Should see in server logs:
   # "Job published successfully: {jobId}"
   ```

3. Verify `jobIds` in order metadata:
   ```typescript
   // Check in database
   SELECT metadata FROM orders WHERE id = 'order_xyz';
   // Should contain: {"jobIds": ["job_123"]}
   ```

4. Check payment system initialization in `src/hooks.server.ts`:
   ```typescript
   // Should have:
   initPaymentSystem();
   ```

### Price ID Not Configured Error

**Problem:** "Price ID not configured for {product} on provider stripe"

**Solutions:**

1. Make sure you ran `pnpm run payments:sync`

2. Verify environment variables are set:
   ```bash
   echo $STRIPE_PRICE_JOB_POSTING_BASE
   echo $STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER
   ```

3. Check products config includes Stripe mapping:
   ```typescript
   stripe: {
     productId: env.STRIPE_PRODUCT_JOB_POSTING_BASE || '',
     priceId: env.STRIPE_PRICE_JOB_POSTING_BASE || ''
   }
   ```

4. Restart dev server after adding env vars

### Order Not Found Error

**Problem:** "Order not found: {orderId}" in webhook processing

**Solutions:**

1. Check order was created before checkout:
   ```sql
   SELECT * FROM orders WHERE id = 'order_xyz';
   ```

2. Verify order ID is passed in metadata:
   ```typescript
   // In checkout.ts
   metadata: {
     orderId: order.id,  // This must match
     userId: order.userId
   }
   ```

3. Check for database connection issues

4. Verify order wasn't deleted before webhook arrived

### Duplicate Payment Processing

**Problem:** Payment processed multiple times for same order

**Solutions:**

1. Verify idempotency check is working:
   ```typescript
   // In webhooks.ts - should prevent duplicates
   const existingPayment = await paymentsRepository
     .findPaymentByProviderPaymentId(providerPaymentId);
   ```

2. Check webhook wasn't registered twice in code

3. In Stripe Dashboard, check if webhook is being retried

4. Ensure webhook endpoint returns 200 status quickly

### TypeScript Errors

**Problem:** Type errors in custom handlers

**Solutions:**

1. Import correct types:
   ```typescript
   import type { PaymentContext } from '$lib/features/payments/types';
   import type { PaymentSystem } from '$lib/features/payments/server/system';
   ```

2. Run type checking:
   ```bash
   pnpm run check
   ```

3. Check that custom handlers match signature:
   ```typescript
   async (ctx: PaymentContext) => Promise<void>
   ```

### Database Schema Issues

**Problem:** Database errors when creating orders/payments

**Solutions:**

1. Run migrations:
   ```bash
   pnpm run db:generate
   pnpm run db:push
   ```

2. Check schema matches repository queries:
   ```bash
   pnpm run db:studio
   # Verify orders and payments tables exist
   ```

3. Verify foreign key constraints are correct

### Test Payments Not Working

**Problem:** Can't complete test payments

**Solutions:**

1. Use correct test card number: `4242 4242 4242 4242`

2. Check Stripe is in test mode (URL contains `/test/`)

3. Verify test API keys are being used (start with `sk_test_`)

4. Clear browser cache and try again

5. Check browser console for JavaScript errors

---

## Related Documentation

- **Backend Architecture**: [docs/backend-architecture.md](./backend-architecture.md)
- **Type System**: [docs/type-system-template.md](./type-system-template.md)
- **Payment System Plan**: [tasks/payment-system-v2-plan.md](../tasks/payment-system-v2-plan.md)

---

## Support

If you encounter issues not covered here:

1. Check Stripe logs: https://dashboard.stripe.com/test/logs
2. Check webhook delivery: https://dashboard.stripe.com/test/webhooks
3. Review server logs for error messages
4. Check database for order/payment records
5. Verify all environment variables are set correctly

For Stripe-specific questions, see: https://docs.stripe.com
