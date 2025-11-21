import { siteConfig } from '$lib/server/site-config';

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
