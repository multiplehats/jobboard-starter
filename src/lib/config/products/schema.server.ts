import { z } from 'zod';

/**
 * Products Configuration Schema
 *
 * DO NOT MODIFY - This is the factory schema that validates product configuration.
 *
 * This unified schema supports:
 * - Product pricing in cents (not dollars)
 * - Provider mappings (Stripe, DodoPayments)
 * - Both predefined upsell IDs (with backend support) and custom IDs
 * - Payment system configuration
 */

/**
 * Provider product mapping schema
 * Maps products to provider-specific IDs (e.g., Stripe product/price IDs)
 */
export const providerProductSchema = z.object({
	productId: z.string().min(1, 'Product ID is required'),
	priceId: z.string().min(1, 'Price ID is required')
});

export type ProviderProductMapping = z.infer<typeof providerProductSchema>;

/**
 * Job posting base product schema
 */
export const jobPostingProductSchema = z.object({
	// Pricing (in cents!)
	price: z.number().int().nonnegative().default(9900), // $99.00 in cents
	currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
	duration: z.number().int().positive().default(30), // days

	// Display (optional - comes from i18n if not provided)
	name: z.string().optional(),
	description: z.string().optional(),

	// Provider mappings (optional - required for payment processing)
	stripe: providerProductSchema.optional(),
	dodopayments: providerProductSchema.optional(),
	polar: providerProductSchema.optional()
});

export type JobPostingProduct = z.infer<typeof jobPostingProductSchema>;

/**
 * Upsell product schema
 * Supports both predefined IDs (with backend support) and custom IDs
 */
export const upsellProductSchema = z.object({
	id: z.string().min(1), // Can be predefined ID or custom string
	enabled: z.boolean().default(true),

	// Pricing (in cents!)
	price: z.number().int().positive(), // Must be positive for upsells

	// Display (optional for predefined IDs - comes from i18n)
	// For predefined IDs: name/description come from i18n (omit these fields)
	// For custom IDs: name/description are required
	name: z.string().optional(),
	description: z.string().optional(),
	badge: z.string().optional(), // e.g. "Popular", "Recommended"

	// Provider mappings (optional - required for payment processing)
	stripe: providerProductSchema.optional(),
	dodopayments: providerProductSchema.optional(),
	polar: providerProductSchema.optional()
});

export type UpsellProduct = z.infer<typeof upsellProductSchema>;

/**
 * Payment configuration schema
 */
export const paymentConfigSchema = z.object({
	defaultProvider: z.enum(['stripe', 'dodopayments', 'polar']).default('stripe'),
	webhooks: z
		.object({
			verifySignature: z.boolean().default(true),
			logEvents: z.boolean().default(true)
		})
		.optional()
});

export type PaymentConfig = z.infer<typeof paymentConfigSchema>;

/**
 * Full products configuration schema
 * This is the single source of truth for product pricing and payment configuration
 */
export const productsConfigSchema = z.object({
	// Job posting base product
	jobPosting: jobPostingProductSchema,

	// Upsells/Upgrades
	upsells: z.array(upsellProductSchema).default([
		{
			id: 'email_newsletter',
			// name and description come from i18n: pricing.upsells.email_newsletter.*
			price: 5000, // $50.00 in cents
			enabled: true
		}
	]),

	// Payment settings (optional)
	payment: paymentConfigSchema.optional()
});

export type ProductsConfig = z.infer<typeof productsConfigSchema>;
