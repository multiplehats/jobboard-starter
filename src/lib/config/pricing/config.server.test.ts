import { describe, it, expect, beforeEach } from 'vitest';
import {
	getPricingConfig,
	enrichUpsellsWithTranslations,
	UpsellHelpers,
	DEFAULT_PRICING_CONFIG
} from './config.server';
import { isPredefinedUpsellId } from './constants.server';
import type { PricingConfig } from './schema.server';

describe('Pricing Configuration', () => {
	describe('getPricingConfig()', () => {
		it('should return default pricing config', () => {
			const config = getPricingConfig();

			expect(config).toBeDefined();
			expect(config.jobPosting).toBeDefined();
			expect(config.jobPosting.basePriceUSD).toBeGreaterThan(0);
			expect(config.jobPosting.currency).toBe('USD');
			expect(config.jobPosting.defaultDuration).toBeGreaterThan(0);
		});

		it('should return config with upsells array', () => {
			const config = getPricingConfig();

			expect(Array.isArray(config.jobPosting.upsells)).toBe(true);
		});

		it('should have valid base price', () => {
			const config = getPricingConfig();

			expect(config.jobPosting.basePriceUSD).toBe(99);
			expect(typeof config.jobPosting.basePriceUSD).toBe('number');
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
			const upsells: PricingConfig['jobPosting']['upsells'] = [
				{
					id: 'email_newsletter',
					priceUSD: 50,
					enabled: true
				}
			];

			const enriched = enrichUpsellsWithTranslations(upsells, mockMessages);

			expect(enriched[0].name).toBe('Feature in Email Newsletter');
			expect(enriched[0].description).toBe('Include your job posting in our weekly newsletter');
			expect(enriched[0].priceUSD).toBe(50);
			expect(enriched[0].enabled).toBe(true);
		});

		it('should preserve custom upsell name and description', () => {
			const upsells: PricingConfig['jobPosting']['upsells'] = [
				{
					id: 'my_custom_feature',
					name: 'My Custom Feature',
					description: 'Custom description',
					priceUSD: 99,
					enabled: true
				}
			];

			const enriched = enrichUpsellsWithTranslations(upsells, mockMessages);

			expect(enriched[0].name).toBe('My Custom Feature');
			expect(enriched[0].description).toBe('Custom description');
		});

		it('should throw error for custom upsell without name', () => {
			const upsells: PricingConfig['jobPosting']['upsells'] = [
				{
					id: 'my_custom_feature',
					priceUSD: 99,
					enabled: true
				}
			];

			expect(() => enrichUpsellsWithTranslations(upsells, mockMessages)).toThrow(
				'Custom upsell "my_custom_feature" must have name and description in config'
			);
		});

		it('should preserve badge field', () => {
			const upsells: PricingConfig['jobPosting']['upsells'] = [
				{
					id: 'email_newsletter',
					priceUSD: 50,
					enabled: true,
					badge: 'Popular'
				}
			];

			const enriched = enrichUpsellsWithTranslations(upsells, mockMessages);

			expect(enriched[0].badge).toBe('Popular');
		});

		it('should handle multiple upsells with mixed predefined and custom', () => {
			const upsells: PricingConfig['jobPosting']['upsells'] = [
				{
					id: 'email_newsletter',
					priceUSD: 50,
					enabled: true
				},
				{
					id: 'my_custom',
					name: 'Custom',
					description: 'Custom desc',
					priceUSD: 25,
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
					expect(upsell.priceUSD).toBeDefined();
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

	describe('DEFAULT_PRICING_CONFIG', () => {
		it('should have valid structure', () => {
			expect(DEFAULT_PRICING_CONFIG.jobPosting).toBeDefined();
			expect(DEFAULT_PRICING_CONFIG.jobPosting.basePriceUSD).toBeGreaterThan(0);
			expect(DEFAULT_PRICING_CONFIG.jobPosting.currency).toBe('USD');
			expect(DEFAULT_PRICING_CONFIG.jobPosting.defaultDuration).toBeGreaterThan(0);
		});

		it('should have valid upsells array', () => {
			const upsells = DEFAULT_PRICING_CONFIG.jobPosting.upsells;

			expect(Array.isArray(upsells)).toBe(true);

			upsells.forEach((upsell) => {
				expect(upsell.id).toBeDefined();
				expect(typeof upsell.priceUSD).toBe('number');
				expect(typeof upsell.enabled).toBe('boolean');

				// Custom upsells must have name and description
				if (!isPredefinedUpsellId(upsell.id)) {
					expect(upsell.name).toBeDefined();
					expect(upsell.description).toBeDefined();
				}
			});
		});

		it('should have unique upsell IDs', () => {
			const upsells = DEFAULT_PRICING_CONFIG.jobPosting.upsells;
			const ids = upsells.map((u) => u.id);
			const uniqueIds = new Set(ids);

			expect(ids.length).toBe(uniqueIds.size);
		});
	});
});
