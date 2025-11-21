/**
 * Products Configuration Module
 *
 * This module handles all product pricing, upsells, and payment configuration.
 * This is the SINGLE SOURCE OF TRUTH for product pricing and payment settings.
 *
 * Files:
 * - schema.server.ts: Zod schema for validation (DO NOT MODIFY)
 * - constants.server.ts: Predefined upsell IDs with backend support (DO NOT MODIFY)
 * - config.server.ts: Products configuration and helpers (SAFE TO CUSTOMIZE)
 *
 * All files use `.server.ts` suffix for SvelteKit server-only protection.
 * This prevents accidental client-side imports and provides compile-time safety.
 *
 * Usage:
 * ```typescript
 * import { getProductsConfig, UpsellHelpers } from '$lib/config/products';
 * ```
 */

export * from './schema.server';
export * from './config.server';
export * from './constants.server';
