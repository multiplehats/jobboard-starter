import type { PageServerLoad } from './$types';
import { getPricingConfig } from '$lib/server/site-config';

export const load: PageServerLoad = async () => {
	const pricingConfig = getPricingConfig();

	return {
		pricing: pricingConfig.jobPosting
	};
};
