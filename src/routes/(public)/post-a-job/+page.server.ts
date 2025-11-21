import type { PageServerLoad } from './$types';
import { getPricingConfig, enrichUpsellsWithTranslations } from '$lib/config/products';
import { getJobBoardConfig } from '$lib/config/jobs/config.server';
import * as m from '$lib/paraglide/messages';

export const load: PageServerLoad = async () => {
	const pricingConfig = getPricingConfig();
	const jobBoardConfig = getJobBoardConfig();

	// Enrich upsells with i18n translations
	const enrichedUpsells = enrichUpsellsWithTranslations(pricingConfig.upsells, m);

	return {
		pricing: {
			...pricingConfig.jobPosting,
			upsells: enrichedUpsells
		},
		jobBoardConfig
	};
};
