import { dev } from '$app/environment';
import { siteConfig } from '$lib/config/site.server.js';
import { resolveConfig } from './presets.server.js';
import type { JobBoardConfig } from './schema.server.js';

let cachedConfig: JobBoardConfig | null = null;

/**
 * Get the resolved job board configuration
 *
 * IMPORTANT: Config changes require server restart in production.
 * In development mode, config is refreshed on each call for better DX.
 *
 * @param forceRefresh - Force refresh of cached config (useful for testing)
 * @returns Validated job board configuration
 */
export function getJobBoardConfig(forceRefresh = false): JobBoardConfig {
	// In dev mode, always refresh for better DX
	// In production, cache unless forceRefresh is true
	if (!cachedConfig || forceRefresh || dev) {
		cachedConfig = resolveConfig(siteConfig.jobBoard);
	}
	return cachedConfig;
}

/**
 * Clear the cached config (useful for testing)
 */
export function clearConfigCache(): void {
	cachedConfig = null;
}
