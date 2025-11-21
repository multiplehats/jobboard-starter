import { describe, it, expect } from 'vitest';
import { pricingConfigSchema } from './schema.server';

describe('Pricing Schema Validation', () => {
	describe('pricingConfigSchema', () => {
		it('should validate valid pricing config', () => {
			const validConfig = {
				jobPosting: {
					basePriceUSD: 99,
					currency: 'USD',
					defaultDuration: 30,
					upsells: [
						{
							id: 'email_newsletter',
							priceUSD: 50,
							enabled: true
						}
					]
				}
			};

			const result = pricingConfigSchema.safeParse(validConfig);

			expect(result.success).toBe(true);
		});

		it('should apply defaults for missing fields', () => {
			const minimalConfig = {
				jobPosting: {
					upsells: []
				}
			};

			const result = pricingConfigSchema.parse(minimalConfig);

			expect(result.jobPosting.basePriceUSD).toBe(99);
			expect(result.jobPosting.currency).toBe('USD');
			expect(result.jobPosting.defaultDuration).toBe(30);
		});

		it('should reject negative base price', () => {
			const invalidConfig = {
				jobPosting: {
					basePriceUSD: -10,
					currency: 'USD',
					defaultDuration: 30,
					upsells: []
				}
			};

			const result = pricingConfigSchema.safeParse(invalidConfig);

			expect(result.success).toBe(false);
		});

		it('should reject zero base price', () => {
			const invalidConfig = {
				jobPosting: {
					basePriceUSD: 0,
					currency: 'USD',
					defaultDuration: 30,
					upsells: []
				}
			};

			const result = pricingConfigSchema.safeParse(invalidConfig);

			expect(result.success).toBe(false);
		});

		it('should allow optional name and description for upsells', () => {
			const config = {
				jobPosting: {
					basePriceUSD: 99,
					currency: 'USD',
					defaultDuration: 30,
					upsells: [
						{
							id: 'test_upsell',
							priceUSD: 50,
							enabled: true
							// name and description are optional
						}
					]
				}
			};

			const result = pricingConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should validate upsell with all fields', () => {
			const config = {
				jobPosting: {
					basePriceUSD: 99,
					currency: 'USD',
					defaultDuration: 30,
					upsells: [
						{
							id: 'test_upsell',
							name: 'Test Upsell',
							description: 'Test description',
							priceUSD: 50,
							enabled: true,
							badge: 'Popular'
						}
					]
				}
			};

			const result = pricingConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.jobPosting.upsells[0].badge).toBe('Popular');
			}
		});

		it('should apply default enabled=true for upsells', () => {
			const config = {
				jobPosting: {
					basePriceUSD: 99,
					currency: 'USD',
					defaultDuration: 30,
					upsells: [
						{
							id: 'test_upsell',
							priceUSD: 50
							// enabled not provided
						}
					]
				}
			};

			const result = pricingConfigSchema.parse(config);

			expect(result.jobPosting.upsells[0].enabled).toBe(true);
		});

		it('should validate multiple upsells', () => {
			const config = {
				jobPosting: {
					basePriceUSD: 99,
					currency: 'USD',
					defaultDuration: 30,
					upsells: [
						{
							id: 'upsell_1',
							priceUSD: 50,
							enabled: true
						},
						{
							id: 'upsell_2',
							priceUSD: 75,
							enabled: false
						},
						{
							id: 'upsell_3',
							name: 'Custom',
							description: 'Custom upsell',
							priceUSD: 100,
							enabled: true,
							badge: 'Recommended'
						}
					]
				}
			};

			const result = pricingConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.jobPosting.upsells).toHaveLength(3);
			}
		});

		it('should accept empty upsells array', () => {
			const config = {
				jobPosting: {
					basePriceUSD: 99,
					currency: 'USD',
					defaultDuration: 30,
					upsells: []
				}
			};

			const result = pricingConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should reject invalid upsell structure', () => {
			const config = {
				jobPosting: {
					basePriceUSD: 99,
					currency: 'USD',
					defaultDuration: 30,
					upsells: [
						{
							// Missing required id field
							priceUSD: 50,
							enabled: true
						}
					]
				}
			};

			const result = pricingConfigSchema.safeParse(config);

			expect(result.success).toBe(false);
		});

		it('should reject upsell without priceUSD', () => {
			const config = {
				jobPosting: {
					basePriceUSD: 99,
					currency: 'USD',
					defaultDuration: 30,
					upsells: [
						{
							id: 'test',
							enabled: true
							// Missing priceUSD
						}
					]
				}
			};

			const result = pricingConfigSchema.safeParse(config);

			expect(result.success).toBe(false);
		});
	});
});
