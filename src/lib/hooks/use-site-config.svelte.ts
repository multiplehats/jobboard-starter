import { getContext, setContext } from 'svelte';
import type { ClientSiteConfig } from '$lib/config/site.server';

const SITE_CONFIG_KEY = Symbol('siteConfig');

export function setSiteConfig(config: ClientSiteConfig) {
	setContext(SITE_CONFIG_KEY, config);
}

export function useSiteConfig(): ClientSiteConfig {
	const config = getContext<ClientSiteConfig>(SITE_CONFIG_KEY);

	if (!config) {
		throw new Error(
			'useSiteConfig must be called within a component that has setSiteConfig in a parent'
		);
	}

	return config;
}
