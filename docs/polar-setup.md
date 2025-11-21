# Polar Payment Setup Guide

This guide explains how to set up Polar as your payment provider for job postings.

## Overview

Polar is a modern payment platform with support for one-time payments, subscriptions, and usage-based billing. This integration supports one-time payments for job postings.

**Why Polar?**
- Developer-friendly API and SDK
- Built-in support for metered billing
- Transparent pricing
- Great for indie developers and startups

## Prerequisites

- Polar account ([sign up](https://polar.sh))
- Polar access token
- Products configured in `src/lib/config/products/config.server.ts`

## Quick Start

### 1. Get Polar Credentials

1. Log in to [Polar Dashboard](https://polar.sh/dashboard)
2. Navigate to **Settings → API**
3. Create a new access token
4. Copy your access token and webhook secret

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Polar Configuration
POLAR_API_KEY="polar_at_..."
POLAR_WEBHOOK_SECRET="whsec_..."
POLAR_SERVER="sandbox"  # or "production"
```

**Servers:**
- `sandbox` - For development and testing
- `production` - For live payments

### 3. Configure Products

Edit `src/lib/config/products/config.server.ts`:

```typescript
import { env } from '$env/dynamic/private';

export const DEFAULT_PRODUCTS_CONFIG: ProductsConfig = {
  jobPosting: {
    price: 9900,        // $99 in cents
    currency: 'USD',
    duration: 30,       // days

    // Add Polar mapping
    polar: {
      productId: env.POLAR_PRODUCT_JOB_POSTING_BASE || '',
      priceId: env.POLAR_PRICE_JOB_POSTING_BASE || ''
    }
  },

  upsells: [
    {
      id: 'email_newsletter',
      price: 5000,      // $50 in cents
      enabled: true,

      // Add Polar mapping
      polar: {
        productId: env.POLAR_PRODUCT_UPSELL_EMAIL_NEWSLETTER || '',
        priceId: env.POLAR_PRICE_UPSELL_EMAIL_NEWSLETTER || ''
      }
    }
  ],

  // Set Polar as default provider
  payment: {
    defaultProvider: 'polar',
    webhooks: {
      verifySignature: true,
      logEvents: true
    }
  }
};
```

### 4. Sync Products to Polar

Run the sync command to create products in Polar:

```bash
pnpm run payments:sync:polar
```

**Output example:**
```
🚀 Syncing products to Polar...
   Server: sandbox

📦 Creating job posting product...
✅ Job Posting: prod_ABC123
   Price ID: price_DEF456
   Add to .env:
   POLAR_PRODUCT_JOB_POSTING_BASE=prod_ABC123
   POLAR_PRICE_JOB_POSTING_BASE=price_DEF456

📦 Creating upsell: email_newsletter...
✅ email_newsletter: prod_GHI789
   Price ID: price_JKL012
   Add to .env:
   POLAR_PRODUCT_UPSELL_EMAIL_NEWSLETTER=prod_GHI789
   POLAR_PRICE_UPSELL_EMAIL_NEWSLETTER=price_JKL012

✅ Sync complete!
```

### 5. Update Environment Variables

Copy the product/price IDs from the sync output to your `.env`:

```bash
# Polar Product/Price IDs
POLAR_PRODUCT_JOB_POSTING_BASE="prod_ABC123"
POLAR_PRICE_JOB_POSTING_BASE="price_DEF456"
POLAR_PRODUCT_UPSELL_EMAIL_NEWSLETTER="prod_GHI789"
POLAR_PRICE_UPSELL_EMAIL_NEWSLETTER="price_JKL012"
```

### 6. Configure Webhook

In Polar Dashboard:

1. Navigate to **Settings → Webhooks**
2. Click **Add webhook endpoint**
3. Enter webhook URL: `https://yourdomain.com/api/webhooks/polar`
4. Select events:
   - `checkout.completed`
   - `checkout.failed`
   - `order.refunded`
5. Copy the webhook signing secret
6. Add to `.env` as `POLAR_WEBHOOK_SECRET`

**For local development:**
Use a tool like [ngrok](https://ngrok.com/) or [localhost.run](https://localhost.run/) to expose your local server:

```bash
# Terminal 1: Run your app
pnpm run dev

# Terminal 2: Expose local server
ngrok http 5173
```

Then use the ngrok URL in Polar Dashboard: `https://abc123.ngrok.io/api/webhooks/polar`

## Testing

### Test Cards

Polar provides test payment methods in sandbox mode. Use these for testing:

**Successful Payment:**
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

**Failed Payment:**
- Card number: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

### Test Flow

1. Ensure Polar product/price IDs are in `.env` and products config
2. Restart your dev server to load new env vars
3. Create a job posting
4. Select upsells (optional)
5. Click "Proceed to Payment"
6. Use test card to complete payment
7. Verify job is published in database

### Verify in Database

```sql
-- Check orders
SELECT * FROM orders WHERE provider = 'polar' ORDER BY created_at DESC LIMIT 10;

-- Check payments
SELECT * FROM payments WHERE provider = 'polar' ORDER BY created_at DESC LIMIT 10;

-- Check published jobs
SELECT id, title, status, published_at, paid_amount
FROM jobs
WHERE status = 'published'
ORDER BY published_at DESC;
```

## Webhook Events

The Polar adapter handles these webhook events:

| Polar Event | Normalized Event | Action |
|-------------|------------------|--------|
| `checkout.completed` | `payment.succeeded` | Create payment record, publish job |
| `checkout.failed` | `payment.failed` | Update order status to failed |
| `order.refunded` | `payment.refunded` | Update order/payment status, unpublish job |

## Customization

### How Product IDs Flow Through the System

For a complete explanation of how environment variables flow through to checkout sessions, see [Payment Data Flow](./payment-data-flow.md).

**Quick Summary:**

1. **Environment Variables** (`.env`):
   ```bash
   POLAR_PRODUCT_JOB_POSTING_BASE="prod_ABC123"
   POLAR_PRICE_JOB_POSTING_BASE="price_DEF456"
   ```

2. **Products Config** (`src/lib/config/products/config.server.ts`):
   ```typescript
   import { env } from '$env/dynamic/private';

   jobPosting: {
     price: 9900,
     ...(env.POLAR_PRODUCT_JOB_POSTING_BASE && {
       polar: {
         productId: env.POLAR_PRODUCT_JOB_POSTING_BASE,
         priceId: env.POLAR_PRICE_JOB_POSTING_BASE
       }
     })
   }
   ```

3. **Checkout Service** uses the config to get price IDs:
   ```typescript
   // In checkout.ts
   const config = getProductsConfig();
   const priceId = config.jobPosting.polar?.priceId;
   ```

4. **Polar Adapter** creates checkout session with the price ID

See [Payment Data Flow](./payment-data-flow.md) for detailed diagrams and debugging tips.

### Custom Payment Handlers

Add custom logic after payment events in `hooks.server.ts`:

```typescript
import { getPaymentSystem } from '$lib/features/payments/server/system';

const paymentSystem = initPaymentSystem();

// Send confirmation email after payment
paymentSystem.on('payment.succeeded', async (ctx) => {
  if (ctx.provider === 'polar') {
    await sendEmail({
      to: ctx.order.userId,
      template: 'polar-payment-confirmation',
      data: { order: ctx.order }
    });
  }
});
```

### Using Multiple Providers

You can use both Stripe and Polar:

```typescript
// In products config
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

// Choose default
payment: {
  defaultProvider: 'polar' // or 'stripe'
}
```

Users can still checkout with either provider by specifying in the order creation:

```typescript
const result = await createOrderRemote({
  items: [...],
  successUrl: '...',
  cancelUrl: '...',
  provider: 'stripe' // or 'polar'
});
```

## Troubleshooting

### Webhook Signature Verification Fails

**Symptom:** Webhooks return 400 error

**Solutions:**
1. Verify `POLAR_WEBHOOK_SECRET` is set correctly
2. Check webhook secret in Polar Dashboard matches `.env`
3. Ensure webhook URL is correct (includes `/api/webhooks/polar`)
4. Test with `verifySignature: false` temporarily (not for production!)

### Products Not Created in Polar

**Symptom:** Sync command fails

**Solutions:**
1. Verify `POLAR_ACCESS_TOKEN` is valid
2. Check token has permission to create products
3. Ensure `POLAR_SERVER` is set correctly ('sandbox' or 'production')
4. Check Polar API status

### Payment Succeeds But Job Not Published

**Symptom:** Payment completes but job stays in draft

**Solutions:**
1. Check webhook is configured in Polar Dashboard
2. Verify webhook events include `checkout.completed`
3. Check server logs for webhook processing errors
4. Verify `handleJobPostingPayment` handler is registered
5. Check job ID is in order metadata

### Price ID Not Configured

**Symptom:** Error "Price ID not configured for job_posting_base on provider polar"

**Solutions:**
1. Run `pnpm run payments:sync:polar`
2. Copy product/price IDs to `.env`
3. Update products config with polar mappings
4. Restart development server

## Production Checklist

Before going live with Polar:

- [ ] Switch to production server (`POLAR_SERVER="production"`)
- [ ] Use live access token (not sandbox token)
- [ ] Configure production webhook endpoint
- [ ] Test complete payment flow in production
- [ ] Set up error monitoring/logging
- [ ] Document refund process
- [ ] Train support team on Polar dashboard

## Differences from Stripe

| Feature | Stripe | Polar |
|---------|--------|-------|
| API Complexity | More complex | Simpler, modern |
| Pricing | Transaction fees | Transparent pricing |
| Best For | Established businesses | Indie developers, startups |
| Checkout UI | Fully customizable | Pre-built, modern |
| Documentation | Extensive | Good, growing |

## Related Documentation

- [Payment Setup Guide](./payments-setup.md) - General payment setup
- [Stripe Setup](./payments-setup.md#stripe-setup) - Stripe-specific setup
- [Backend Architecture](./backend-architecture.md) - System architecture
- [Polar Documentation](https://docs.polar.sh) - Official Polar docs

## Support

- **Polar Support:** support@polar.sh
- **Polar Discord:** [Join community](https://discord.gg/polar)
- **Polar Docs:** https://docs.polar.sh
- **Polar SDK:** https://github.com/polarsource/polar

---

**Ready to accept payments with Polar! 🎉**
