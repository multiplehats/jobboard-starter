import { z } from 'zod';

/**
 * Pricing configuration schema
 *
 * DO NOT MODIFY - This is the factory schema that validates pricing configuration.
 *
 * Accepts both predefined upsell IDs (with backend support) and custom IDs.
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
					// For predefined IDs: name/description come from i18n (omit these fields)
					// For custom IDs: name/description are required
					name: z.string().optional(),
					description: z.string().optional(),
					priceUSD: z.number(),
					enabled: z.boolean().default(true),
					badge: z.string().optional() // e.g. "Popular", "Recommended"
				})
			)
			.default([
				{
					id: 'email_newsletter',
					// name and description come from i18n: pricing.upsells.email_newsletter.*
					priceUSD: 50,
					enabled: true
				}
			])
	})
});

export type PricingConfig = z.infer<typeof pricingConfigSchema>;
