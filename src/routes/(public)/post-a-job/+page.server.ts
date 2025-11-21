import type { PageServerLoad } from './$types';
import { getPricingConfig, enrichUpsellsWithTranslations } from '$lib/config/pricing';
import * as m from '$lib/paraglide/messages';

export const load: PageServerLoad = async () => {
	const pricingConfig = getPricingConfig();

	// Enrich upsells with i18n translations
	const enrichedUpsells = enrichUpsellsWithTranslations(pricingConfig.jobPosting.upsells, m);

	return {
		pricing: {
			...pricingConfig.jobPosting,
			upsells: enrichedUpsells
		}
	};
};
