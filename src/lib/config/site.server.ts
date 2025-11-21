import { env } from '$env/dynamic/private';

/**
 * Site configuration.
 *
 * You cannot import this client-side. It is passed down from the root +layout.server.ts file.
 * And can be accessed client-side using the `useSiteConfig` hook or via `page.data.config`.
 */
export const siteConfig = {
	appName: 'Job Board Starter',
	optionalEnv: {
		firecrawlApiKey: env.FIRECRAWL_API_KEY ?? null,
		openRouterApiKey: env.OPENROUTER_API_KEY ?? null
	},
	flags: {
		darkMode: true,
		/**
		 * Enable or disable the "Prefill from ATS" feature on the job posting form.
		 * If enabled, make sure to set the FIRECRAWL_API_KEY environment variable for Firecrawl integration.
		 * This does not apply to the admin job posting form, that will simply check if the Firecrawl API key is set.
		 */
		prefillJobFromURL: true,
		/**
		 * Enable or disable AI-powered job description enrichment when prefilling from a URL.
		 * When enabled, uses OpenRouter API to generate a well-formatted, comprehensive job description
		 * with proper sections (responsibilities, requirements, benefits, etc.) from the scraped content.
		 *
		 * Requires OPENROUTER_API_KEY environment variable to be set.
		 *
		 * NOTE: If disabled or if enrichment fails, the description field will be left empty for manual entry.
		 * We intentionally do NOT use raw scraped markdown as a fallback because it's typically low quality.
		 */
		enrichDescription: true
	},
	auth: {
		authPageImage: '/public/auth-screen.jpg'
	},
	featuredRecruiters: [
		{
			name: 'Linear',
			logo: 'https://metadata.stacksee.com/linear.app',
			href: 'https://linear.app'
		},
		{
			name: 'Plausible',
			logo: 'https://metadata.stacksee.com/plausible.io',
			href: 'https://plausible.io'
		},
		{
			name: 'Slash',
			logo: 'https://metadata.stacksee.com/slash.com',
			href: 'https://slash.com'
		}
	],
	featuredTalents: [
		{
			name: 'Sindre Sorhus',
			avatar: '/public/avatar-1.png'
		},
		{
			name: 'Kent C. Dodds',
			avatar: '/public/avatar-2.png'
		},
		{
			name: 'Cassidy Williams',
			avatar: '/public/avatar-3.png'
		}
	]
} as const;

export type SiteConfig = typeof siteConfig;
export type ClientSiteConfig = Pick<SiteConfig, 'flags'>;
