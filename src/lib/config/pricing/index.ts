/**
 * Pricing Configuration Module
 *
 * This module handles all job posting pricing and upsells configuration.
 *
 * Files:
 * - schema.server.ts: Zod schema for validation (DO NOT MODIFY)
 * - constants.server.ts: Predefined upsell IDs with backend support (DO NOT MODIFY)
 * - config.server.ts: Pricing configuration and helpers (SAFE TO CUSTOMIZE)
 *
 * All files use `.server.ts` suffix for SvelteKit server-only protection.
 * This prevents accidental client-side imports and provides compile-time safety.
 *
 * Usage:
 * ```typescript
 * import { getPricingConfig, UpsellHelpers } from '$lib/config/pricing';
 * ```
 */

export * from './schema.server';
export * from './config.server';
export * from './constants.server';
