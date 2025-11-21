import { describe, it, expect } from 'vitest';
import { productsConfigSchema } from './schema.server';

describe('Products Schema Validation', () => {
	describe('productsConfigSchema', () => {
		it('should validate valid products config', () => {
			const validConfig = {
				jobPosting: {
					price: 9900, // cents
					currency: 'USD',
					duration: 30
				},
				upsells: [
					{
						id: 'email_newsletter',
						price: 5000, // cents
						enabled: true
					}
				]
			};

			const result = productsConfigSchema.safeParse(validConfig);

			expect(result.success).toBe(true);
		});

		it('should apply defaults for missing fields', () => {
			const minimalConfig = {
				jobPosting: {}
			};

			const result = productsConfigSchema.parse(minimalConfig);

			expect(result.jobPosting.price).toBe(9900);
			expect(result.jobPosting.currency).toBe('USD');
			expect(result.jobPosting.duration).toBe(30);
			expect(result.upsells).toEqual([
				{
					id: 'email_newsletter',
					price: 5000,
					enabled: true
				}
			]);
		});

		it('should reject negative base price', () => {
			const invalidConfig = {
				jobPosting: {
					price: -1000, // negative
					currency: 'USD',
					duration: 30
				}
			};

			const result = productsConfigSchema.safeParse(invalidConfig);

			expect(result.success).toBe(false);
		});

		it('should allow zero base price (for free listings)', () => {
			const validConfig = {
				jobPosting: {
					price: 0, // free listing
					currency: 'USD',
					duration: 30
				}
			};

			const result = productsConfigSchema.safeParse(validConfig);

			expect(result.success).toBe(true);
		});

		it('should allow optional name and description for upsells', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30
				},
				upsells: [
					{
						id: 'test_upsell',
						price: 5000,
						enabled: true
						// name and description are optional
					}
				]
			};

			const result = productsConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should validate upsell with all fields', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30
				},
				upsells: [
					{
						id: 'test_upsell',
						name: 'Test Upsell',
						description: 'Test description',
						price: 5000,
						enabled: true,
						badge: 'Popular'
					}
				]
			};

			const result = productsConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.upsells[0].badge).toBe('Popular');
			}
		});

		it('should apply default enabled=true for upsells', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30
				},
				upsells: [
					{
						id: 'test_upsell',
						price: 5000
						// enabled not provided
					}
				]
			};

			const result = productsConfigSchema.parse(config);

			expect(result.upsells[0].enabled).toBe(true);
		});

		it('should validate multiple upsells', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30
				},
				upsells: [
					{
						id: 'upsell_1',
						price: 5000,
						enabled: true
					},
					{
						id: 'upsell_2',
						price: 7500,
						enabled: false
					},
					{
						id: 'upsell_3',
						name: 'Custom',
						description: 'Custom upsell',
						price: 10000,
						enabled: true,
						badge: 'Recommended'
					}
				]
			};

			const result = productsConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.upsells).toHaveLength(3);
			}
		});

		it('should accept empty upsells array', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30
				},
				upsells: []
			};

			const result = productsConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should reject invalid upsell structure', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30
				},
				upsells: [
					{
						// Missing required id field
						price: 5000,
						enabled: true
					}
				]
			};

			const result = productsConfigSchema.safeParse(config);

			expect(result.success).toBe(false);
		});

		it('should reject upsell without price', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30
				},
				upsells: [
					{
						id: 'test',
						enabled: true
						// Missing price
					}
				]
			};

			const result = productsConfigSchema.safeParse(config);

			expect(result.success).toBe(false);
		});

		it('should validate provider mappings', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30,
					stripe: {
						productId: 'prod_123',
						priceId: 'price_123'
					}
				},
				upsells: [
					{
						id: 'email_newsletter',
						price: 5000,
						enabled: true,
						stripe: {
							productId: 'prod_456',
							priceId: 'price_456'
						}
					}
				]
			};

			const result = productsConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should validate payment config', () => {
			const config = {
				jobPosting: {
					price: 9900,
					currency: 'USD',
					duration: 30
				},
				upsells: [],
				payment: {
					defaultProvider: 'stripe' as const,
					webhooks: {
						verifySignature: true,
						logEvents: true
					}
				}
			};

			const result = productsConfigSchema.safeParse(config);

			expect(result.success).toBe(true);
		});
	});
});
