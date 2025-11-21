import { siteConfig } from './site-config';

/**
 * This is an optional Firecrawl client generator.
 *
 * @returns
 */
export async function getFirecrawlClient() {
	const apiKey = siteConfig.optionalEnv.firecrawlApiKey;
	if (!apiKey) {
		throw new Error('FIRECRAWL_API_KEY is not set in environment variables.');
	}

	const { Firecrawl } = await import('@mendable/firecrawl-js');

	return new Firecrawl({ apiKey });
}
