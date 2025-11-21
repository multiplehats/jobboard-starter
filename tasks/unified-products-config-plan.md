# Unified Products Configuration Plan

**Goal**: Merge pricing config and payment config into ONE single source of truth

---

## Problem Statement

Currently we have TWO configuration systems:

1. **PRICING_CONFIG.md** - Defines prices and upsells for display
2. **Payment System v2 Plan** - Defines products and provider mappings

This creates:
- ❌ Duplication of product definitions
- ❌ Two sources of truth for prices
- ❌ Confusion about where to edit
- ❌ Risk of drift and bugs

---

## Solution: Single Products Config

### New Structure

```
src/lib/config/products/
├── schema.server.ts              ← CORE (Zod validation)
├── constants.server.ts           ← CORE (predefined upsell IDs)
├── products.config.ts            ← USER CUSTOMIZES (everything)
└── index.ts                      ← CORE (barrel export)
```

**Key Changes:**
1. Rename `pricing/` → `products/` (more accurate)
2. Add provider mappings to schema
3. Use cents (not dollars) for consistency
4. Single source of truth for payment system AND display

---

## Unified Schema

**File**: `src/lib/config/products/schema.server.ts` ← CORE

```typescript
import { z } from 'zod';

/**
 * Products Configuration Schema
 * DO NOT MODIFY - Used for validation
 */

// Provider product mapping
export const providerProductSchema = z.object({
	productId: z.string().min(1, 'Product ID is required'),
	priceId: z.string().min(1, 'Price ID is required')
});

// Job posting product
export const jobPostingProductSchema = z.object({
	// Pricing
	price: z.number().int().nonnegative(), // in cents (0 for free)
	currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
	duration: z.number().int().positive().default(30),

	// Display (optional - comes from i18n if not provided)
	name: z.string().optional(),
	description: z.string().optional(),

	// Provider mappings
	stripe: providerProductSchema.optional(),
	dodopayments: providerProductSchema.optional()
});

// Upsell product
export const upsellProductSchema = z.object({
	id: z.string().min(1),
	enabled: z.boolean().default(true),

	// Pricing
	price: z.number().int().positive(), // in cents

	// Display (optional for predefined IDs - comes from i18n)
	name: z.string().optional(),
	description: z.string().optional(),
	badge: z.string().optional(),

	// Provider mappings
	stripe: providerProductSchema.optional(),
	dodopayments: providerProductSchema.optional()
});

// Full products config
export const productsConfigSchema = z.object({
	// Job posting base product
	jobPosting: jobPostingProductSchema,

	// Upsells
	upsells: z.array(upsellProductSchema).default([]),

	// Payment settings
	payment: z.object({
		defaultProvider: z.enum(['stripe', 'dodopayments']).default('stripe'),
		webhooks: z.object({
			verifySignature: z.boolean().default(true),
			logEvents: z.boolean().default(true)
		}).optional()
	}).optional()
});

export type ProductsConfig = z.infer<typeof productsConfigSchema>;
export type JobPostingProduct = z.infer<typeof jobPostingProductSchema>;
export type UpsellProduct = z.infer<typeof upsellProductSchema>;
```

---

## User Configuration Example

**File**: `src/lib/config/products/products.config.ts` ← USER CUSTOMIZES

```typescript
import type { ProductsConfig } from './schema.server';
import { env } from '$env/dynamic/private';

/**
 * Products Configuration
 *
 * SAFE TO CUSTOMIZE - This is your single source of truth for:
 * - Product pricing
 * - Payment provider mappings
 * - Upsells and features
 * - Display settings
 *
 * Setup:
 * 1. Configure your products and prices below
 * 2. Run: pnpm run products:sync (syncs to Stripe)
 * 3. Copy generated env vars to .env
 * 4. Test: pnpm run products:test
 */

export const productsConfig: ProductsConfig = {
	jobPosting: {
		// Pricing (in cents!)
		price: 9900, // $99.00
		currency: 'USD',
		duration: 30, // days

		// Display (optional - uses i18n if not provided)
		name: 'Job Posting',
		description: '30-day job listing',

		// Provider mappings
		stripe: {
			productId: env.STRIPE_PRODUCT_JOB_POSTING || '',
			priceId: env.STRIPE_PRICE_JOB_POSTING || ''
		}
	},

	upsells: [
		{
			id: 'email_newsletter', // Predefined - auto i18n
			enabled: true,
			price: 4900, // $49.00
			badge: 'Popular',

			stripe: {
				productId: env.STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER || '',
				priceId: env.STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER || ''
			}
		},
		{
			id: 'priority_placement', // Predefined - auto i18n
			enabled: true,
			price: 2900, // $29.00
			badge: 'Recommended',

			stripe: {
				productId: env.STRIPE_PRODUCT_UPSELL_PRIORITY || '',
				priceId: env.STRIPE_PRICE_UPSELL_PRIORITY || ''
			}
		},
		{
			id: 'my_custom_feature', // Custom - needs name/description
			enabled: true,
			price: 1900, // $19.00
			name: 'My Custom Feature',
			description: 'Custom feature description',

			stripe: {
				productId: env.STRIPE_PRODUCT_UPSELL_CUSTOM || '',
				priceId: env.STRIPE_PRICE_UPSELL_CUSTOM || ''
			}
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

/**
 * Get validated products configuration
 */
export function getProductsConfig(): ProductsConfig {
	return productsConfig;
}
```

---

## Integration with Payment System

### Payment System Reads from Products Config

**File**: `src/lib/features/payments/checkout.server.ts` ← CORE

```typescript
import { getProductsConfig } from '$lib/config/products';

function calculateItemPrice(item: OrderItem): number {
	const config = getProductsConfig();

	if (item.productId === 'job_posting_base') {
		return config.jobPosting.price; // Already in cents!
	}

	// Check upsells
	const upsell = config.upsells.find(u => u.id === item.productId);
	if (upsell) {
		return upsell.price; // Already in cents!
	}

	throw new Error(`Unknown product: ${item.productId}`);
}

function orderToLineItems(order: Order, provider: string): LineItem[] {
	const config = getProductsConfig();
	const lineItems: LineItem[] = [];

	for (const item of order.items) {
		let priceId: string | undefined;

		if (item.productId === 'job_posting_base') {
			priceId = config.jobPosting[provider]?.priceId;
		} else {
			const upsell = config.upsells.find(u => u.id === item.productId);
			priceId = upsell?.[provider]?.priceId;
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

---

## Integration with Display Layer

### Display Layer Reads from Products Config

**File**: `src/routes/(public)/post-a-job/+page.server.ts`

```typescript
import { getProductsConfig } from '$lib/config/products';
import { enrichUpsellsWithTranslations } from '$lib/config/products/i18n';

export const load: PageServerLoad = async () => {
	const config = getProductsConfig();

	// Enrich predefined upsells with i18n translations
	const upsells = enrichUpsellsWithTranslations(config.upsells);

	return {
		pricing: {
			basePrice: config.jobPosting.price,
			currency: config.jobPosting.currency,
			duration: config.jobPosting.duration,
			upsells
		}
	};
};
```

**File**: `src/lib/config/products/i18n.ts` ← CORE

```typescript
import * as m from '$lib/paraglide/messages';
import type { UpsellProduct } from './schema.server';
import { PREDEFINED_UPSELL_IDS } from './constants.server';

/**
 * Enrich upsells with i18n translations for predefined IDs
 */
export function enrichUpsellsWithTranslations(upsells: UpsellProduct[]) {
	return upsells.map(upsell => {
		// If it's a predefined ID and no name/description, use i18n
		if (PREDEFINED_UPSELL_IDS.includes(upsell.id)) {
			const i18nKey = `pricing.upsells.${upsell.id}`;

			return {
				...upsell,
				name: upsell.name || m[i18nKey]?.name?.() || upsell.id,
				description: upsell.description || m[i18nKey]?.description?.() || ''
			};
		}

		// Custom upsell - must have name/description
		return upsell;
	});
}
```

---

## CLI Tool: Sync Products to Stripe

**File**: `scripts/products/sync.ts`

```typescript
#!/usr/bin/env tsx
import Stripe from 'stripe';
import { getProductsConfig } from '$lib/config/products';
import { env } from '$env/dynamic/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

async function syncProducts() {
	const config = getProductsConfig();

	console.log('🔄 Syncing products to Stripe...\n');

	// 1. Sync job posting base
	console.log('Creating job posting product...');
	const jobProduct = await stripe.products.create({
		name: config.jobPosting.name || 'Job Posting',
		description: config.jobPosting.description || `${config.jobPosting.duration}-day listing`
	});

	const jobPrice = await stripe.prices.create({
		product: jobProduct.id,
		unit_amount: config.jobPosting.price,
		currency: config.jobPosting.currency.toLowerCase()
	});

	console.log(`✅ Job Posting: ${jobProduct.id} / ${jobPrice.id}`);
	console.log(`   STRIPE_PRODUCT_JOB_POSTING=${jobProduct.id}`);
	console.log(`   STRIPE_PRICE_JOB_POSTING=${jobPrice.id}\n`);

	// 2. Sync upsells
	for (const upsell of config.upsells) {
		if (!upsell.enabled) continue;

		console.log(`Creating upsell: ${upsell.id}...`);
		const product = await stripe.products.create({
			name: upsell.name || upsell.id,
			description: upsell.description || `Job posting upsell: ${upsell.id}`
		});

		const price = await stripe.prices.create({
			product: product.id,
			unit_amount: upsell.price,
			currency: config.jobPosting.currency.toLowerCase()
		});

		const envVarName = `STRIPE_PRODUCT_UPSELL_${upsell.id.toUpperCase()}`;
		const envVarPrice = `STRIPE_PRICE_UPSELL_${upsell.id.toUpperCase()}`;

		console.log(`✅ ${upsell.id}: ${product.id} / ${price.id}`);
		console.log(`   ${envVarName}=${product.id}`);
		console.log(`   ${envVarPrice}=${price.id}\n`);
	}

	console.log('✅ Sync complete! Copy the environment variables above to your .env file.');
}

syncProducts().catch(console.error);
```

**Usage**: `pnpm run products:sync`

---

## Database Changes

### Remove `job_payments` Table

Since we're not launched yet, we can simplify by removing the `job_payments` junction table and storing payment info directly in the `jobs` table.

**File**: `src/lib/server/db/schema/jobs.ts`

```typescript
// Add payment fields to jobs table
export const jobs = pgTable('jobs', {
	// ... existing fields

	// Payment info (instead of separate job_payments table)
	paymentId: text('payment_id').references(() => payments.id),
	paidAmount: integer('paid_amount'), // Total amount paid (in cents)
	selectedUpsells: json('selected_upsells').$type<string[]>(), // Already exists!

	// ... rest of fields
});
```

This simplifies queries:
```typescript
// Find all jobs by payment
const job = await db.query.jobs.findFirst({
	where: eq(jobs.paymentId, paymentId)
});

// Check if job is paid
if (job.paymentId && job.paidAmount > 0) {
	// Job is paid
}
```

---

## Migration Steps

### 1. Rename Directory
```bash
mv src/lib/config/pricing src/lib/config/products
```

### 2. Update Schema
Add provider mappings to `schema.server.ts`

### 3. Update Config File
Change from dollars to cents:
```diff
- basePriceUSD: 99
+ price: 9900  // cents
```

Add provider mappings:
```typescript
stripe: {
  productId: env.STRIPE_PRODUCT_JOB_POSTING,
  priceId: env.STRIPE_PRICE_JOB_POSTING
}
```

### 4. Update All Imports
```bash
# Find and replace
src/lib/config/pricing → src/lib/config/products
getPricingConfig → getProductsConfig
```

### 5. Update Jobs Table
Add payment fields:
```bash
pnpm run db:generate
pnpm run db:push
```

### 6. Remove Unused Files
Delete payment config files from payment system (now using products config)

---

## Benefits

✅ **Single Source of Truth** - One config file for everything
✅ **No Duplication** - Prices defined once
✅ **Type Safe** - Full TypeScript + Zod validation
✅ **Provider Agnostic** - Easy to add new providers
✅ **i18n Support** - Predefined upsells auto-translated
✅ **Simplified Database** - No job_payments table needed
✅ **Easy Sync** - One CLI command to sync to Stripe
✅ **Merge Friendly** - Users only customize one file

---

## File Structure Summary

### What Users Customize
```
src/lib/config/products/
└── products.config.ts            ← EDIT THIS (one source of truth)
```

### What Upstream Maintains
```
src/lib/config/products/
├── schema.server.ts              ← CORE (validation)
├── constants.server.ts           ← CORE (predefined IDs)
├── i18n.ts                       ← CORE (i18n enrichment)
└── index.ts                      ← CORE (barrel export)

src/lib/features/payments/
├── types.ts                      ← CORE
├── system.server.ts              ← CORE
├── checkout.server.ts            ← CORE (reads from products config)
├── webhooks.server.ts            ← CORE
├── handlers.server.ts            ← CORE
└── adapters/
    ├── adapter.ts                ← CORE
    └── stripe.server.ts          ← CORE

scripts/products/
└── sync.ts                       ← CORE (sync to Stripe)
```

---

## Updated Documentation

The docs would be unified into:

**File**: `docs/products-config.md`

Combines:
- Product configuration (pricing, upsells)
- Payment provider setup
- i18n support
- CLI tools
- Database schema

One comprehensive guide instead of two separate systems!

---

## Comparison: Before vs After

### Before (Confusing)
```
❌ PRICING_CONFIG.md
   basePriceUSD: 99
   upsells: [...]

❌ PAYMENT_ARCHITECTURE.md
   price: 9900
   products: [...]

Two sources of truth!
```

### After (Simple)
```
✅ PRODUCTS_CONFIG.md
   price: 9900
   upsells: [...]
   stripe: { productId, priceId }

One source of truth!
```

---

## Summary

**The Change**: Merge pricing config and payment config into unified products config

**Why**:
- Eliminates duplication
- One source of truth
- Simpler for users
- Easier to maintain
- No backward compat issues (not launched yet)

**How**:
1. Rename `pricing/` → `products/`
2. Add provider mappings to schema
3. Use cents everywhere (consistency)
4. Payment system reads from products config
5. Remove `job_payments` table (use direct reference in jobs)
6. One CLI tool to sync everything

**Result**: Users edit ONE config file and everything works! 🎉
