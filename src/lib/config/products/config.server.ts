import { isPredefinedUpsellId, PREDEFINED_UPSELL_IDS } from './constants.server';
import type { ProductsConfig } from './schema.server';

/**
 * Default products configuration
 *
 * CUSTOMIZE THIS: You can safely edit this products configuration.
 * These values are used to configure job posting prices, upsells, and payment settings.
 *
 * This is the SINGLE SOURCE OF TRUTH for:
 * - Product pricing (in cents!)
 * - Payment provider mappings (Stripe, DodoPayments)
 * - Upsells and features
 * - Payment system configuration
 *
 * Setup:
 * 1. Configure your products and prices below (prices in cents!)
 * 2. Run: pnpm run products:sync (syncs to Stripe - coming soon)
 * 3. Copy generated env vars to .env
 * 4. Test: pnpm run products:test (coming soon)
 *
 * NOTE: For predefined upsell IDs, name/description come from i18n automatically.
 * See translations in messages/en.json under pricing.upsells.<upsell_id>.*
 * For custom upsell IDs, you must provide name and description in the config.
 */
export const DEFAULT_PRODUCTS_CONFIG: ProductsConfig = {
	jobPosting: {
		// Pricing (in cents!)
		price: 9900, // $99.00
		currency: 'USD',
		duration: 30, // days

		// Display (optional - uses i18n if not provided)
		name: 'Job Posting',
		description: '30-day job listing'

		// Provider mappings (add when you have Stripe products set up)
		// stripe: {
		// 	productId: env.STRIPE_PRODUCT_JOB_POSTING || '',
		// 	priceId: env.STRIPE_PRICE_JOB_POSTING || ''
		// }
	},

	upsells: [
		{
			id: 'email_newsletter', // Predefined ID - name/description from i18n
			price: 5000, // $50.00 in cents
			enabled: true
			// badge: 'Popular'

			// Provider mappings (add when you have Stripe products set up)
			// stripe: {
			// 	productId: env.STRIPE_PRODUCT_UPSELL_EMAIL_NEWSLETTER || '',
			// 	priceId: env.STRIPE_PRICE_UPSELL_EMAIL_NEWSLETTER || ''
			// }
		}
	],

	// Payment settings (optional)
	payment: {
		defaultProvider: 'stripe',
		webhooks: {
			verifySignature: true,
			logEvents: true
		}
	}
};

/**
 * Get products configuration
 * Attempts to load local override, falls back to defaults
 */
export function getProductsConfig(): ProductsConfig {
	// For now, just return defaults
	// To use custom config, users can modify DEFAULT_PRODUCTS_CONFIG
	// or we can implement dynamic import in the future
	return DEFAULT_PRODUCTS_CONFIG;
}

/**
 * Backward compatibility alias
 * @deprecated Use getProductsConfig instead
 */
export function getPricingConfig(): ProductsConfig {
	return getProductsConfig();
}

/**
 * Enrich upsells with i18n translations
 * For predefined IDs: fetch name/description from i18n
 * For custom IDs: use name/description from config (required)
 *
 * This helper is meant to be used server-side in +page.server.ts
 */
export function enrichUpsellsWithTranslations(
	upsells: ProductsConfig['upsells'],
	m: any // Paraglide messages object
) {
	return upsells.map((upsell) => {
		if (isPredefinedUpsellId(upsell.id)) {
			// Predefined ID - use i18n translations
			const key = `pricing.upsells.${upsell.id}` as const;
			return {
				...upsell,
				name: m[`${key}.name`](),
				description: m[`${key}.description`]()
			};
		} else {
			// Custom ID - name/description must be in config
			if (!upsell.name || !upsell.description) {
				throw new Error(
					`Custom upsell "${upsell.id}" must have name and description in config`
				);
			}
			return upsell as Required<typeof upsell>;
		}
	});
}

/**
 * Helper utilities for backend upsell checking
 * Use these in cron jobs, payment webhooks, etc.
 */
export const UpsellHelpers = {
	/**
	 * Check if an upsell ID is one of the predefined IDs with backend support
	 */
	isPredefinedUpsellId,

	/**
	 * Get all predefined upsell IDs that have backend support
	 */
	getPredefinedUpsellIds() {
		return [...PREDEFINED_UPSELL_IDS];
	},

	/**
	 * Check if an upsell is enabled in the current products config
	 */
	isUpsellEnabled(upsellId: string): boolean {
		const config = getProductsConfig();
		const upsell = config.upsells.find((u) => u.id === upsellId);
		return upsell?.enabled ?? false;
	},

	/**
	 * Get an upsell by ID from the current products config
	 */
	getUpsell(upsellId: string) {
		const config = getProductsConfig();
		return config.upsells.find((u) => u.id === upsellId);
	},

	/**
	 * Get all enabled upsells from the current products config
	 */
	getEnabledUpsells() {
		const config = getProductsConfig();
		return config.upsells.filter((u) => u.enabled);
	},

	/**
	 * Get all enabled predefined upsells (those with backend support)
	 */
	getEnabledPredefinedUpsells() {
		const config = getProductsConfig();
		return config.upsells.filter((u) => u.enabled && isPredefinedUpsellId(u.id));
	}
} as const;
