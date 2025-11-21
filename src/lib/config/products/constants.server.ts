/**
 * Predefined Upsell IDs - Backend Feature Support
 *
 * DO NOT MODIFY THIS FILE - These IDs are referenced by backend features.
 *
 * These IDs have built-in backend support via:
 * - Cron jobs (e.g., extending job duration)
 * - Email newsletter features
 * - Analytics and reporting
 * - Payment webhooks
 *
 * You can define custom upsell IDs in your pricing config in config/site.server.ts,
 * but these predefined IDs provide automatic backend functionality.
 *
 * IMPORTANT: DO NOT change these IDs once in production!
 * They are referenced in the database and backend logic.
 */
export const PREDEFINED_UPSELL_IDS = [
	'email_newsletter', // Feature job in weekly email newsletter
	'extended_duration', // Extend job posting duration (e.g., 30 → 60 days)
	'priority_placement', // Pin job to top of search results
	'social_media_boost', // Promote job on social media channels
	'highlighted_listing' // Highlight job with special styling/border
] as const;

export type PredefinedUpsellId = (typeof PREDEFINED_UPSELL_IDS)[number];

/**
 * Upsell ID can be either a predefined ID (with backend support) or a custom string
 */
export type UpsellId = PredefinedUpsellId | string;

/**
 * Helper to check if an upsell ID is one of the predefined IDs with backend support
 */
export function isPredefinedUpsellId(id: string): id is PredefinedUpsellId {
	return PREDEFINED_UPSELL_IDS.includes(id as PredefinedUpsellId);
}
