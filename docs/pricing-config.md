# Job Board Pricing Configuration Guide

This guide explains how to customize job posting pricing and upsells, keeping your configuration separate from form logic.

## Architecture

### File Structure

- **`src/lib/server/pricing-constants.ts`** - Predefined upsell IDs with backend support (DO NOT MODIFY)
- **`src/lib/server/site-config.ts`** - Your pricing configuration (SAFE TO CUSTOMIZE)

This separation ensures you can:

- Pull upstream changes to `pricing-constants.ts` without conflicts
- Safely customize pricing in `site-config.ts` and discard upstream changes to it (unless it's a new feature you want)
- Use predefined IDs with automatic backend features
- Add custom IDs for your own features

## Predefined vs Custom Upsell IDs

### Predefined IDs (Backend Support)

These IDs are defined in `pricing-constants.ts` and have built-in backend support:

- `email_newsletter` - Automatic email newsletter integration
- `extended_duration` - Cron job extends job posting duration
- `priority_placement` - Pin job to top of search results
- `social_media_boost` - Social media promotion automation
- `highlighted_listing` - Special styling/border in listings

**Note:** Selected upsells are stored in the `jobs.selectedUpsells` database column as a JSON array of upsell IDs (e.g., `["email_newsletter", "priority_placement"]`). This flexible design allows unlimited upsells without schema changes.

### Custom IDs (Your Features)

You can also define your own upsell IDs for custom features:

```typescript
{
  id: 'my_custom_feature',  // Your custom ID
  name: 'My Custom Feature',
  description: 'Description of your feature',
  priceUSD: 99,
  enabled: true
}
```

**Note:** Custom IDs won't have automatic backend support - you'll need to implement the functionality yourself.

## Quick Start

### 1. Open Site Config

Edit the pricing configuration in `src/lib/server/site-config.ts`:

```typescript
// Find DEFAULT_PRICING_CONFIG in src/lib/server/site-config.ts
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
	jobPosting: {
		basePriceUSD: 99,     // ← Change this
		currency: 'USD',       // ← And this
		defaultDuration: 30,   // ← And this
		upsells: [             // ← Customize these
			// ...
		]
	}
};
```

### 2. Customize Your Pricing

Example customization in `src/lib/server/site-config.ts`:

```typescript
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
	jobPosting: {
		// Change base price
		basePriceUSD: 299,  // Was 99, now 299

		// Change currency (optional)
		currency: 'USD',

		// Change duration
		defaultDuration: 60,  // Was 30 days, now 60

		// Add/modify upsells (use predefined IDs for backend support)
		upsells: [
			{
				id: 'email_newsletter',  // Predefined - has backend support
				name: 'Feature in Email Newsletter',
				description: 'Include your job posting in our weekly newsletter',
				priceUSD: 149,  // Change price
				enabled: true,
				badge: 'Popular'  // Optional badge
			},
			{
				id: 'extended_duration',  // Predefined - cron job handles this
				name: 'Extended Duration',
				description: 'Keep your job live for 60 days',
				priceUSD: 75,
				enabled: true
			},
			{
				id: 'my_custom_feature',  // Custom ID - you implement the logic
				name: 'My Custom Feature',
				description: 'Your custom feature description',
				priceUSD: 50,
				enabled: true
			}
		]
	}
};
```

### 3. Save and Reload

The dev server will automatically reload with your new pricing!

## Configuration Options

### Base Price

```typescript
basePriceUSD: 99  // Base price in USD
```

The base price is always shown and required for job posting.

### Currency

```typescript
currency: 'USD'  // USD, EUR, GBP, etc.
```

Display currency for all pricing (base + upsells).

### Default Duration

```typescript
defaultDuration: 30  // Number of days
```

How long the job post stays active.

### Upsells

Each upsell has the following structure:

```typescript
{
	id: 'unique_id',              // Unique identifier (use predefined IDs for backend support)
	name: 'Display Name',          // Shown to users
	description: 'Full description of the upsell',
	priceUSD: 50,                  // Price in USD
	enabled: true,                 // Show/hide this upsell
	badge: 'Popular'               // Optional badge (Popular, Recommended, etc.)
}
```

**Upsell ID Guidelines:**

- Use predefined IDs from `pricing-constants.ts` for automatic backend support
- Use custom IDs for features you'll implement yourself
- IDs must be unique within your config
- Use snake_case (e.g., `my_feature` not `myFeature`)

#### Common Upsells

**Email Newsletter Feature**

```typescript
{
	id: 'email_newsletter',
	name: 'Feature in Email Newsletter',
	description: 'Include your job posting in our weekly newsletter sent to thousands of job seekers',
	priceUSD: 99,
	enabled: true,
	badge: 'Popular'
}
```

**Extended Duration**

```typescript
{
	id: 'extended_duration',
	name: 'Extended Duration (60 days)',
	description: 'Keep your job posting live for 60 days instead of 30',
	priceUSD: 75,
	enabled: true
}
```

**Priority Placement**

```typescript
{
	id: 'priority_placement',
	name: 'Priority Placement',
	description: 'Pin your job to the top of search results for maximum visibility',
	priceUSD: 149,
	enabled: true,
	badge: 'Recommended'
}
```

**Social Media Boost**

```typescript
{
	id: 'social_media_boost',
	name: 'Social Media Promotion',
	description: 'Promote your job across our social media channels',
	priceUSD: 199,
	enabled: false  // Hidden by default
}
```

## Examples

### Example 1: Premium Job Board

High-value job board with premium pricing:

```typescript
export const customPricingConfig: PricingConfig = {
	jobPosting: {
		basePriceUSD: 499,
		currency: 'USD',
		defaultDuration: 60,
		upsells: [
			{
				id: 'featured_listing',
				name: 'Featured Listing',
				description: 'Highlight your job with premium placement and styling',
				priceUSD: 299,
				enabled: true,
				badge: 'Most Popular'
			},
			{
				id: 'extended_exposure',
				name: 'Extended 90-Day Listing',
				description: 'Triple your exposure with a 90-day active listing',
				priceUSD: 399,
				enabled: true,
				badge: 'Best Value'
			},
			{
				id: 'social_boost',
				name: 'Social Media Campaign',
				description: 'Dedicated social media promotion across LinkedIn, Twitter, and our newsletter',
				priceUSD: 599,
				enabled: true
			}
		]
	}
};
```

### Example 2: Budget-Friendly Board

Lower pricing for startups:

```typescript
export const customPricingConfig: PricingConfig = {
	jobPosting: {
		basePriceUSD: 49,
		currency: 'USD',
		defaultDuration: 30,
		upsells: [
			{
				id: 'email_feature',
				name: 'Newsletter Feature',
				description: 'Get featured in our weekly jobs newsletter',
				priceUSD: 29,
				enabled: true,
				badge: 'Recommended'
			},
			{
				id: 'highlight',
				name: 'Highlighted Listing',
				description: 'Stand out with a highlighted border and icon',
				priceUSD: 19,
				enabled: true
			}
		]
	}
};
```

### Example 3: Freemium Model

Free base posting with paid upsells:

```typescript
export const customPricingConfig: PricingConfig = {
	jobPosting: {
		basePriceUSD: 0,  // Free!
		currency: 'USD',
		defaultDuration: 14,  // Shorter duration for free posts
		upsells: [
			{
				id: 'premium_30_days',
				name: 'Premium 30-Day Listing',
				description: 'Upgrade to featured placement for 30 days',
				priceUSD: 99,
				enabled: true,
				badge: 'Most Popular'
			},
			{
				id: 'social_boost',
				name: 'Social Media Boost',
				description: 'Share across our social channels',
				priceUSD: 49,
				enabled: true
			}
		]
	}
};
```

## How It Works

### Architecture

1. **Configuration** (`src/lib/server/site-config.ts`)
   - Central location for all pricing configuration
   - Type-safe with Zod schema validation
   - Separate from form logic

2. **Server Load** (`src/routes/(public)/post-a-job/+page.server.ts`)
   - Loads pricing config server-side
   - Passes to frontend via page data

3. **Dynamic UI** (`src/routes/(public)/post-a-job/+page.svelte`)
   - Renders all pricing from configuration
   - Calculates totals automatically
   - Shows/hides upsells based on `enabled` flag

### Benefits

✅ **Centralized Configuration** - All pricing in one place
✅ **Type-Safe** - Full TypeScript + Zod validation
✅ **Separation of Concerns** - Config separate from form logic
✅ **Hot Reload** - Changes apply on save (dev mode)
✅ **Unlimited Upsells** - Add as many as you need
✅ **Easy Customization** - No need to touch form code
✅ **Backend Support** - Predefined IDs work automatically
✅ **Custom Features** - Add your own upsells easily

## Working with Upsells in Backend Code

### Using UpsellHelpers

The `UpsellHelpers` object provides utilities for working with upsells in backend code (cron jobs, webhooks, etc.):

```typescript
import { UpsellHelpers } from '$lib/server/site-config';

// Check if an ID is predefined (has backend support)
if (UpsellHelpers.isPredefinedUpsellId('email_newsletter')) {
  // This upsell has automatic backend support
}

// Get all predefined upsell IDs
const predefinedIds = UpsellHelpers.getPredefinedUpsellIds();
// ['email_newsletter', 'extended_duration', 'priority_placement', ...]

// Check if an upsell is enabled in the config
if (UpsellHelpers.isUpsellEnabled('email_newsletter')) {
  // User has enabled this upsell
}

// Get a specific upsell configuration
const upsell = UpsellHelpers.getUpsell('email_newsletter');
console.log(upsell?.priceUSD); // 50

// Get all enabled upsells
const enabled = UpsellHelpers.getEnabledUpsells();

// Get only enabled predefined upsells (those with backend support)
const enabledWithBackend = UpsellHelpers.getEnabledPredefinedUpsells();
```

### Example: Cron Job

```typescript
// src/lib/server/cron/extend-jobs.ts
import { UpsellHelpers } from '$lib/server/site-config';
import { db } from '$lib/server/db';

export async function extendJobDurations() {
  // Only run if extended_duration upsell is enabled
  if (!UpsellHelpers.isUpsellEnabled('extended_duration')) {
    return;
  }

  // Find jobs with the extended_duration upsell purchased
  const jobs = await db.query.jobs.findMany({
    where: (jobs, { arrayContains }) =>
      arrayContains(jobs.purchasedUpsells, ['extended_duration'])
  });

  // Extend their duration
  for (const job of jobs) {
    await db.update(jobs).set({
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
    }).where(eq(jobs.id, job.id));
  }
}
```

### Example: Payment Webhook

```typescript
// src/routes/api/webhooks/stripe/+server.ts
import { UpsellHelpers } from '$lib/server/site-config';

export async function POST({ request }) {
  const event = await parseStripeEvent(request);

  if (event.type === 'payment_intent.succeeded') {
    const metadata = event.data.object.metadata;
    const purchasedUpsells = JSON.parse(metadata.upsells);

    // Check which predefined upsells were purchased
    for (const upsellId of purchasedUpsells) {
      if (UpsellHelpers.isPredefinedUpsellId(upsellId)) {
        // This has backend support - trigger automatic processing
        await processUpsell(upsellId, metadata.jobId);
      }
    }
  }

  return new Response('OK', { status: 200 });
}
```

## Advanced

### Environment-Based Pricing

Want different pricing for dev/staging/production?

```typescript
// pricing.config.local.ts
const isProd = process.env.NODE_ENV === 'production';

export const customPricingConfig: PricingConfig = {
	jobPosting: {
		basePriceUSD: isProd ? 299 : 49,  // Higher in prod
		currency: 'USD',
		defaultDuration: 30,
		// ... rest of config
	}
};
```

### Multiple Currency Support

While the config uses USD, you can display in other currencies by converting:

```typescript
// In your config
basePriceUSD: 100,  // Always store in USD

// Then convert for display
const exchangeRate = 0.85; // EUR rate
const priceInEUR = basePriceUSD * exchangeRate;
```

### Seasonal Pricing

```typescript
const isHolidaySeason = () => {
	const month = new Date().getMonth();
	return month === 11 || month === 0;  // Dec or Jan
};

export const customPricingConfig: PricingConfig = {
	jobPosting: {
		basePriceUSD: isHolidaySeason() ? 149 : 199,  // Holiday discount
		// ...
	}
};
```

## Troubleshooting

### Changes Not Showing

1. Save the file: `src/lib/server/site-config.ts`
2. Check dev server console for errors
3. Refresh browser (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
4. Restart dev server if needed: `pnpm run dev`

### Type Errors

The `PricingConfig` type is automatically inferred from the schema. If you get type errors:

1. Check all required fields are present:
   - `basePriceUSD` (must be positive number)
   - `currency` (string)
   - `defaultDuration` (number)
   - `upsells` (array)

2. Check upsell structure (each must have):
   - `id` (unique string)
   - `name` (string)
   - `description` (string)
   - `priceUSD` (number)
   - `enabled` (boolean)
   - `badge` (optional string)

### Validation Errors

Check the browser console for Zod validation errors. Common issues:

- Negative prices
- Missing required fields
- Duplicate upsell IDs
- Invalid data types

## Support

Need help? Check:

- Example configurations in this guide
- Predefined IDs: `src/lib/server/pricing-constants.ts`
- Schema definition: `src/lib/server/site-config.ts` (pricingConfigSchema)
- Type definitions: `PricingConfig`, `UpsellId`, `PredefinedUpsellId`
- Backend utilities: `UpsellHelpers` in `site-config.ts`

## File Reference

- **`src/lib/server/pricing-constants.ts`** - Predefined upsell IDs (DO NOT MODIFY)
- **`src/lib/server/site-config.ts`** - Your pricing configuration (CUSTOMIZE THIS)
- **`src/routes/(public)/post-a-job/+page.server.ts`** - Loads pricing config
- **`src/routes/(public)/post-a-job/+page.svelte`** - Renders pricing UI

---

**Remember**: All pricing configuration lives in `DEFAULT_PRICING_CONFIG` in `src/lib/server/site-config.ts`. Edit this directly - it's designed to be customized and is clearly marked as safe to modify.
