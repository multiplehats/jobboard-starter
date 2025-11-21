import { isPredefinedUpsellId, PREDEFINED_UPSELL_IDS } from './constants.server';
import type { PricingConfig } from './schema.server';

/**
 * Default pricing configuration
 *
 * CUSTOMIZE THIS: You can safely edit this pricing configuration.
 * These values are used to configure job posting prices and upsells.
 *
 * See PRICING_CONFIG.md for detailed documentation and examples.
 *
 * NOTE: For predefined upsell IDs, name/description come from i18n automatically.
 * See translations in messages/en.json under pricing.upsells.<upsell_id>.*
 * For custom upsell IDs, you must provide name and description in the config.
 */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
	jobPosting: {
		basePriceUSD: 99,
		currency: 'USD',
		defaultDuration: 30,
		upsells: [
			{
				id: 'email_newsletter', // Predefined ID - name/description from i18n
				priceUSD: 50,
				enabled: true
			}
		]
	}
};

/**
 * Get pricing configuration
 * Attempts to load local override, falls back to defaults
 */
export function getPricingConfig(): PricingConfig {
	// For now, just return defaults
	// To use custom config, users can modify DEFAULT_PRICING_CONFIG
	// or we can implement dynamic import in the future
	return DEFAULT_PRICING_CONFIG;
}

/**
 * Enrich upsells with i18n translations
 * For predefined IDs: fetch name/description from i18n
 * For custom IDs: use name/description from config (required)
 *
 * This helper is meant to be used server-side in +page.server.ts
 */
export function enrichUpsellsWithTranslations(
	upsells: PricingConfig['jobPosting']['upsells'],
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
	 * Check if an upsell is enabled in the current pricing config
	 */
	isUpsellEnabled(upsellId: string): boolean {
		const config = getPricingConfig();
		const upsell = config.jobPosting.upsells.find((u) => u.id === upsellId);
		return upsell?.enabled ?? false;
	},

	/**
	 * Get an upsell by ID from the current pricing config
	 */
	getUpsell(upsellId: string) {
		const config = getPricingConfig();
		return config.jobPosting.upsells.find((u) => u.id === upsellId);
	},

	/**
	 * Get all enabled upsells from the current pricing config
	 */
	getEnabledUpsells() {
		const config = getPricingConfig();
		return config.jobPosting.upsells.filter((u) => u.enabled);
	},

	/**
	 * Get all enabled predefined upsells (those with backend support)
	 */
	getEnabledPredefinedUpsells() {
		const config = getPricingConfig();
		return config.jobPosting.upsells.filter((u) => u.enabled && isPredefinedUpsellId(u.id));
	}
} as const;
