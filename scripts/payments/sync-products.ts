#!/usr/bin/env tsx
import Stripe from 'stripe';
import { getProductsConfig } from '../../src/lib/config/products';

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error('STRIPE_SECRET_KEY environment variable is required to run this.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function syncProducts() {
	const config = getProductsConfig();

	console.log('🔄 Syncing products to Stripe...\n');

	// 1. Sync job posting base
	console.log('Creating job posting base product...');
	const jobPostingProduct = await stripe.products.create({
		name: config.jobPosting.name || 'Job Posting',
		description: config.jobPosting.description || `${config.jobPosting.duration}-day job listing`
	});

	const jobPostingPrice = await stripe.prices.create({
		product: jobPostingProduct.id,
		unit_amount: config.jobPosting.price,
		currency: config.jobPosting.currency.toLowerCase()
	});

	console.log(`✅ Job Posting: ${jobPostingProduct.id} / ${jobPostingPrice.id}`);
	console.log(`   Add to .env:`);
	console.log(`   STRIPE_PRODUCT_JOB_POSTING_BASE=${jobPostingProduct.id}`);
	console.log(`   STRIPE_PRICE_JOB_POSTING_BASE=${jobPostingPrice.id}\n`);

	// 2. Sync upsells
	for (const upsell of config.upsells) {
		if (!upsell.enabled) continue;

		console.log(`Creating upsell: ${upsell.id}...`);
		const product = await stripe.products.create({
			name: `Upsell: ${upsell.id}`,
			description: `Job posting upsell`
		});

		const price = await stripe.prices.create({
			product: product.id,
			unit_amount: upsell.price,
			currency: config.jobPosting.currency.toLowerCase()
		});

		console.log(`✅ ${upsell.id}: ${product.id} / ${price.id}`);
		console.log(`   Add to .env:`);
		console.log(`   STRIPE_PRODUCT_UPSELL_${upsell.id.toUpperCase()}=${product.id}`);
		console.log(`   STRIPE_PRICE_UPSELL_${upsell.id.toUpperCase()}=${price.id}\n`);
	}

	console.log('✅ Sync complete!');
}

syncProducts().catch(console.error);
