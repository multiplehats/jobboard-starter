import { siteConfig } from './site-config';

/**
 * This is an optional OpenRouter client generator.
 * OpenRouter provides access to multiple AI models through a single API.
 *
 * @returns OpenRouter instance configured with the API key
 * @throws Error if OPENROUTER_API_KEY is not set in environment variables
 */
export async function getOpenRouterClient() {
	const apiKey = siteConfig.optionalEnv.openRouterApiKey;
	if (!apiKey) {
		throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
	}

	const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');

	return createOpenRouter({ apiKey });
}
