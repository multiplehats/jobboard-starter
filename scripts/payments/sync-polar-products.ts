#!/usr/bin/env tsx
/**
 * Sync products to Polar
 *
 * This script creates Polar products and prices for job postings and upsells.
 * Unlike subscriptions, we create one-time payment products.
 *
 * Usage:
 * 1. Set POLAR_ACCESS_TOKEN in your .env file
 * 2. Run: pnpm run payments:sync:polar
 * 3. Copy the output environment variables to your .env file
 *
 * Note: Polar uses a different pricing model than Stripe.
 * For job postings, we use one-time payment products.
 */

import { Polar } from '@polar-sh/sdk';
import { getProductsConfig } from '$lib/config/products';
import { env } from '$env/dynamic/private';

// Check for required environment variables
if (!env.POLAR_ACCESS_TOKEN) {
	console.error('❌ POLAR_ACCESS_TOKEN environment variable is required');
	console.error('Please set your Polar access token in your .env file');
	process.exit(1);
}

const polar = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: (env.POLAR_SERVER as 'sandbox' | 'production') || 'sandbox'
});

async function syncProducts() {
	const config = getProductsConfig();

	console.log('🚀 Syncing products to Polar...');
	console.log(`   Server: ${env.POLAR_SERVER || 'sandbox'}`);
	console.log('');

	try {
		// 1. Sync job posting product
		console.log('📦 Creating job posting product...');

		const jobPostingProduct = await polar.products.create({
			name: 'Job Posting',
			description: `${config.jobPosting.duration}-day job listing`,
			prices: [
				{
					amountType: 'fixed',
					priceAmount: config.jobPosting.price, // Already in cents
					priceCurrency: config.jobPosting.currency.toLowerCase()
				}
			],
			metadata: {
				type: 'job_posting',
				duration: config.jobPosting.duration.toString()
			}
		});

		// Get the price ID from the created product
		const jobPostingPriceId =
			jobPostingProduct.prices && jobPostingProduct.prices.length > 0
				? jobPostingProduct.prices[0].id
				: '';

		console.log(`✅ Job Posting: ${jobPostingProduct.id}`);
		console.log(`   Price ID: ${jobPostingPriceId}`);
		console.log(`   Add to .env:`);
		console.log(`   POLAR_PRODUCT_JOB_POSTING_BASE=${jobPostingProduct.id}`);
		console.log(`   POLAR_PRICE_JOB_POSTING_BASE=${jobPostingPriceId}`);
		console.log('');

		// 2. Sync upsells
		for (const upsell of config.upsells) {
			if (!upsell.enabled) {
				console.log(`⏭️  Skipping disabled upsell: ${upsell.id}`);
				continue;
			}

			console.log(`📦 Creating upsell: ${upsell.id}...`);

			const upsellProduct = await polar.products.create({
				name: `Upsell: ${upsell.id}`,
				description: `Job posting upsell - ${upsell.id}`,
				prices: [
					{
						amountType: 'fixed',
						priceAmount: upsell.price, // Already in cents
						priceCurrency: config.jobPosting.currency.toLowerCase()
					}
				],
				metadata: {
					type: 'upsell',
					upsellId: upsell.id
				}
			});

			const upsellPriceId =
				upsellProduct.prices && upsellProduct.prices.length > 0
					? upsellProduct.prices[0].id
					: '';

			const envVarName = `POLAR_PRODUCT_UPSELL_${upsell.id.toUpperCase()}`;
			const priceEnvVarName = `POLAR_PRICE_UPSELL_${upsell.id.toUpperCase()}`;

			console.log(`✅ ${upsell.id}: ${upsellProduct.id}`);
			console.log(`   Price ID: ${upsellPriceId}`);
			console.log(`   Add to .env:`);
			console.log(`   ${envVarName}=${upsellProduct.id}`);
			console.log(`   ${priceEnvVarName}=${upsellPriceId}`);
			console.log('');
		}

		console.log('✅ Sync complete!');
		console.log('');
		console.log('📝 Next steps:');
		console.log('1. Copy the environment variables above to your .env file');
		console.log('2. Update your products config with the Polar product/price IDs');
		console.log('3. Configure webhooks in Polar Dashboard');
		console.log('   Webhook URL: https://yourdomain.com/api/webhooks/polar');
		console.log('   Events: checkout.completed, order.refunded');
	} catch (error) {
		console.error('❌ Error syncing products:', error);
		if (error instanceof Error) {
			console.error('   Message:', error.message);
		}
		process.exit(1);
	}
}

syncProducts().catch(console.error);
