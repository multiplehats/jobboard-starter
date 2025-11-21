import { siteConfig } from '$lib/config/site.server';

export const load = async () => {
	return {
		config: {
			flags: {
				...siteConfig.flags,
				prefillFromATS:
					siteConfig.flags.prefillJobFromURL && siteConfig.optionalEnv.firecrawlApiKey
						? true
						: false
			}
		}
	};
};
