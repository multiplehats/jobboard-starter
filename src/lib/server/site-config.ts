import { env } from '$env/dynamic/private';
import { z } from 'zod';
import {
	PREDEFINED_UPSELL_IDS,
	isPredefinedUpsellId,
	type UpsellId,
	type PredefinedUpsellId
} from './pricing-constants';

// Re-export for convenience
export type { UpsellId, PredefinedUpsellId };

/**
 * Pricing configuration schema
 * Accepts both predefined upsell IDs (with backend support) and custom IDs
 */
export const pricingConfigSchema = z.object({
	jobPosting: z.object({
		basePriceUSD: z.number().positive().default(99),
		currency: z.string().default('USD'),
		defaultDuration: z.number().default(30), // days

		// Upsells/Upgrades
		upsells: z
			.array(
				z.object({
					id: z.string(), // Can be predefined ID or custom string
					name: z.string(),
					description: z.string(),
					priceUSD: z.number(),
					enabled: z.boolean().default(true),
					badge: z.string().optional() // e.g. "Popular", "Recommended"
				})
			)
			.default([
				{
					id: 'email_newsletter',
					name: 'Feature in Email Newsletter',
					description:
						'Include your job posting in our weekly newsletter sent to thousands of job seekers',
					priceUSD: 50,
					enabled: true
				}
			])
	})
});

export type PricingConfig = z.infer<typeof pricingConfigSchema>;

/**
 * Default pricing configuration
 *
 * CUSTOMIZE THIS: You can safely edit this pricing configuration.
 * These values are used to configure job posting prices and upsells.
 *
 * See PRICING_CONFIG.md for detailed documentation and examples.
 */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
	jobPosting: {
		basePriceUSD: 99,
		currency: 'USD',
		defaultDuration: 30,
		upsells: [
			{
				id: 'email_newsletter',
				name: 'Feature in Email Newsletter',
				description:
					'Include your job posting in our weekly newsletter sent to thousands of job seekers',
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
		return config.jobPosting.upsells.filter(
			(u) => u.enabled && isPredefinedUpsellId(u.id)
		);
	}
} as const;

/**
 * Site configuration.
 *
 * You cannot import this client-side. It is passed down from the root +layout.server.ts file.
 * And can be accessed client-side using the `useSiteConfig` hook or via `page.data.config`.
 */
export const siteConfig = {
	appName: 'Job Board Starter',
	optionalEnv: {
		firecrawlApiKey: env.FIRECRAWL_API_KEY ?? null,
		openRouterApiKey: env.OPENROUTER_API_KEY ?? null
	},
	flags: {
		darkMode: true,
		/**
		 * Enable or disable the "Prefill from ATS" feature on the job posting form.
		 * If enabled, make sure to set the FIRECRAWL_API_KEY environment variable for Firecrawl integration.
		 * This does not apply to the admin job posting form, that will simply check if the Firecrawl API key is set.
		 */
		prefillJobFromURL: true,
		/**
		 * Enable or disable AI-powered job description enrichment when prefilling from a URL.
		 * When enabled, uses OpenRouter API to generate a well-formatted, comprehensive job description
		 * with proper sections (responsibilities, requirements, benefits, etc.) from the scraped content.
		 *
		 * Requires OPENROUTER_API_KEY environment variable to be set.
		 *
		 * NOTE: If disabled or if enrichment fails, the description field will be left empty for manual entry.
		 * We intentionally do NOT use raw scraped markdown as a fallback because it's typically low quality.
		 */
		enrichDescription: true
	},
	auth: {
		authPageImage: '/public/auth-screen.jpg'
	},
	featuredRecruiters: [
		{
			name: 'Linear',
			logo: 'https://metadata.stacksee.com/linear.app',
			href: 'https://linear.app'
		},
		{
			name: 'Plausible',
			logo: 'https://metadata.stacksee.com/plausible.io',
			href: 'https://plausible.io'
		},
		{
			name: 'Slash',
			logo: 'https://metadata.stacksee.com/slash.com',
			href: 'https://slash.com'
		}
	],
	featuredTalents: [
		{
			name: 'Sindre Sorhus',
			avatar: '/public/avatar-1.png'
		},
		{
			name: 'Kent C. Dodds',
			avatar: '/public/avatar-2.png'
		},
		{
			name: 'Cassidy Williams',
			avatar: '/public/avatar-3.png'
		}
	]
} as const;

export type SiteConfig = typeof siteConfig;
