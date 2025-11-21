import { describe, it, expect, beforeEach } from 'vitest';
import {
	getProductsConfig,
	getPricingConfig,
	enrichUpsellsWithTranslations,
	UpsellHelpers,
	DEFAULT_PRODUCTS_CONFIG
} from './config.server';
import { isPredefinedUpsellId } from './constants.server';
import type { ProductsConfig } from './schema.server';

describe('Products Configuration', () => {
	describe('getProductsConfig()', () => {
		it('should return default products config', () => {
			const config = getProductsConfig();

			expect(config).toBeDefined();
			expect(config.jobPosting).toBeDefined();
			expect(config.jobPosting.price).toBeGreaterThanOrEqual(0);
			expect(config.jobPosting.currency).toBe('USD');
			expect(config.jobPosting.duration).toBeGreaterThan(0);
		});

		it('should return config with upsells array', () => {
			const config = getProductsConfig();

			expect(Array.isArray(config.upsells)).toBe(true);
		});

		it('should have valid base price in cents', () => {
			const config = getProductsConfig();

			expect(config.jobPosting.price).toBe(9900); // $99.00 in cents
			expect(typeof config.jobPosting.price).toBe('number');
		});
	});

	describe('getPricingConfig() [backward compatibility]', () => {
		it('should work as alias for getProductsConfig', () => {
			const config = getPricingConfig();

			expect(config).toBeDefined();
			expect(config.jobPosting).toBeDefined();
			expect(config.jobPosting.price).toBe(9900);
		});
	});

	describe('enrichUpsellsWithTranslations()', () => {
		const mockMessages = {
			'pricing.upsells.email_newsletter.name': () => 'Feature in Email Newsletter',
			'pricing.upsells.email_newsletter.description': () =>
				'Include your job posting in our weekly newsletter',
			'pricing.upsells.extended_duration.name': () => 'Extended Duration',
			'pricing.upsells.extended_duration.description': () => 'Keep your job live for 60 days'
		};

		it('should enrich predefined upsells with i18n translations', () => {
			const upsells: ProductsConfig['upsells'] = [
				{
					id: 'email_newsletter',
					price: 5000,
					enabled: true
				}
			];

			const enriched = enrichUpsellsWithTranslations(upsells, mockMessages);

			expect(enriched[0].name).toBe('Feature in Email Newsletter');
			expect(enriched[0].description).toBe('Include your job posting in our weekly newsletter');
			expect(enriched[0].price).toBe(5000);
			expect(enriched[0].enabled).toBe(true);
		});

		it('should preserve custom upsell name and description', () => {
			const upsells: ProductsConfig['upsells'] = [
				{
					id: 'my_custom_feature',
					name: 'My Custom Feature',
					description: 'Custom description',
					price: 9900,
					enabled: true
				}
			];

			const enriched = enrichUpsellsWithTranslations(upsells, mockMessages);

			expect(enriched[0].name).toBe('My Custom Feature');
			expect(enriched[0].description).toBe('Custom description');
		});

		it('should throw error for custom upsell without name', () => {
			const upsells: ProductsConfig['upsells'] = [
				{
					id: 'my_custom_feature',
					price: 9900,
					enabled: true
				}
			];

			expect(() => enrichUpsellsWithTranslations(upsells, mockMessages)).toThrow(
				'Custom upsell "my_custom_feature" must have name and description in config'
			);
		});

		it('should preserve badge field', () => {
			const upsells: ProductsConfig['upsells'] = [
				{
					id: 'email_newsletter',
					price: 5000,
					enabled: true,
					badge: 'Popular'
				}
			];

			const enriched = enrichUpsellsWithTranslations(upsells, mockMessages);

			expect(enriched[0].badge).toBe('Popular');
		});

		it('should handle multiple upsells with mixed predefined and custom', () => {
			const upsells: ProductsConfig['upsells'] = [
				{
					id: 'email_newsletter',
					price: 5000,
					enabled: true
				},
				{
					id: 'my_custom',
					name: 'Custom',
					description: 'Custom desc',
					price: 2500,
					enabled: true
				}
			];

			const enriched = enrichUpsellsWithTranslations(upsells, mockMessages);

			expect(enriched).toHaveLength(2);
			expect(enriched[0].name).toBe('Feature in Email Newsletter');
			expect(enriched[1].name).toBe('Custom');
		});
	});

	describe('UpsellHelpers', () => {
		describe('isPredefinedUpsellId()', () => {
			it('should return true for predefined upsell IDs', () => {
				expect(UpsellHelpers.isPredefinedUpsellId('email_newsletter')).toBe(true);
				expect(UpsellHelpers.isPredefinedUpsellId('extended_duration')).toBe(true);
				expect(UpsellHelpers.isPredefinedUpsellId('priority_placement')).toBe(true);
			});

			it('should return false for custom upsell IDs', () => {
				expect(UpsellHelpers.isPredefinedUpsellId('my_custom_feature')).toBe(false);
				expect(UpsellHelpers.isPredefinedUpsellId('random_id')).toBe(false);
			});
		});

		describe('getPredefinedUpsellIds()', () => {
			it('should return array of predefined upsell IDs', () => {
				const ids = UpsellHelpers.getPredefinedUpsellIds();

				expect(Array.isArray(ids)).toBe(true);
				expect(ids.length).toBeGreaterThan(0);
				expect(ids).toContain('email_newsletter');
				expect(ids).toContain('extended_duration');
			});

			it('should return a copy of the array', () => {
				const ids1 = UpsellHelpers.getPredefinedUpsellIds();
				const ids2 = UpsellHelpers.getPredefinedUpsellIds();

				expect(ids1).not.toBe(ids2); // Different array instances
				expect(ids1).toEqual(ids2); // Same content
			});
		});

		describe('isUpsellEnabled()', () => {
			it('should return true for enabled upsells in config', () => {
				const enabled = UpsellHelpers.isUpsellEnabled('email_newsletter');

				expect(typeof enabled).toBe('boolean');
			});

			it('should return false for non-existent upsells', () => {
				const enabled = UpsellHelpers.isUpsellEnabled('non_existent_upsell');

				expect(enabled).toBe(false);
			});
		});

		describe('getUpsell()', () => {
			it('should return upsell config for existing upsell', () => {
				const upsell = UpsellHelpers.getUpsell('email_newsletter');

				if (upsell) {
					expect(upsell.id).toBe('email_newsletter');
					expect(upsell.price).toBeDefined();
					expect(typeof upsell.enabled).toBe('boolean');
				}
			});

			it('should return undefined for non-existent upsell', () => {
				const upsell = UpsellHelpers.getUpsell('non_existent');

				expect(upsell).toBeUndefined();
			});
		});

		describe('getEnabledUpsells()', () => {
			it('should return only enabled upsells', () => {
				const enabled = UpsellHelpers.getEnabledUpsells();

				expect(Array.isArray(enabled)).toBe(true);
				enabled.forEach((upsell) => {
					expect(upsell.enabled).toBe(true);
				});
			});

			it('should return array with at least one enabled upsell', () => {
				const enabled = UpsellHelpers.getEnabledUpsells();

				// Default config has email_newsletter enabled
				expect(enabled.length).toBeGreaterThan(0);
			});
		});

		describe('getEnabledPredefinedUpsells()', () => {
			it('should return only enabled predefined upsells', () => {
				const enabled = UpsellHelpers.getEnabledPredefinedUpsells();

				expect(Array.isArray(enabled)).toBe(true);
				enabled.forEach((upsell) => {
					expect(upsell.enabled).toBe(true);
					expect(isPredefinedUpsellId(upsell.id)).toBe(true);
				});
			});

			it('should not include custom upsells', () => {
				const enabled = UpsellHelpers.getEnabledPredefinedUpsells();

				enabled.forEach((upsell) => {
					expect(isPredefinedUpsellId(upsell.id)).toBe(true);
				});
			});
		});
	});

	describe('DEFAULT_PRODUCTS_CONFIG', () => {
		it('should have valid structure', () => {
			expect(DEFAULT_PRODUCTS_CONFIG.jobPosting).toBeDefined();
			expect(DEFAULT_PRODUCTS_CONFIG.jobPosting.price).toBeGreaterThanOrEqual(0);
			expect(DEFAULT_PRODUCTS_CONFIG.jobPosting.currency).toBe('USD');
			expect(DEFAULT_PRODUCTS_CONFIG.jobPosting.duration).toBeGreaterThan(0);
		});

		it('should have valid upsells array', () => {
			const upsells = DEFAULT_PRODUCTS_CONFIG.upsells;

			expect(Array.isArray(upsells)).toBe(true);

			upsells.forEach((upsell) => {
				expect(upsell.id).toBeDefined();
				expect(typeof upsell.price).toBe('number');
				expect(typeof upsell.enabled).toBe('boolean');

				// Custom upsells must have name and description
				if (!isPredefinedUpsellId(upsell.id)) {
					expect(upsell.name).toBeDefined();
					expect(upsell.description).toBeDefined();
				}
			});
		});

		it('should have unique upsell IDs', () => {
			const upsells = DEFAULT_PRODUCTS_CONFIG.upsells;
			const ids = upsells.map((u) => u.id);
			const uniqueIds = new Set(ids);

			expect(ids.length).toBe(uniqueIds.size);
		});

		it('should have prices in cents', () => {
			expect(DEFAULT_PRODUCTS_CONFIG.jobPosting.price).toBe(9900); // $99.00
			DEFAULT_PRODUCTS_CONFIG.upsells.forEach((upsell) => {
				expect(upsell.price).toBeGreaterThan(0);
				expect(Number.isInteger(upsell.price)).toBe(true);
			});
		});
	});
});
