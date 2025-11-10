import type { Content } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

/**
 * Convert Tiptap JSON content to HTML string for display
 *
 * @example
 * ```typescript
 * const html = tiptapJsonToHtml(job.description);
 * ```
 */
export function tiptapJsonToHtml(json: Content | string): string {
	if (!json) return '';

	// Parse if string
	const content = typeof json === 'string' ? JSON.parse(json) : json;

	// Generate HTML using the same extensions as the editor
	return generateHTML(content, [
		StarterKit,
		// Add other extensions used in your editor here
	]);
}

/**
 * Convert Tiptap JSON content to plain text (strips all formatting)
 * Useful for excerpts, meta descriptions, etc.
 *
 * @example
 * ```typescript
 * const excerpt = tiptapJsonToText(job.description).slice(0, 160);
 * ```
 */
export function tiptapJsonToText(json: Content | string): string {
	const html = tiptapJsonToHtml(json);
	// Strip HTML tags
	return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
