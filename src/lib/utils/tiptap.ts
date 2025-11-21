import type { Content } from '@tiptap/core';
import { generateHTML, generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

// Define extensions used in the editor
const extensions = [StarterKit];

/**
 * Convert HTML string to Tiptap JSON content
 * This is useful for importing HTML content into the Tiptap editor
 *
 * @example
 * ```typescript
 * const json = htmlToTiptapJson('<h2>Hello</h2><p>This is <strong>bold</strong></p>');
 * ```
 */
export function htmlToTiptapJson(html: string): Content {
	if (!html) return { type: 'doc', content: [] };

	// Generate JSON from HTML using the same extensions as the editor
	return generateJSON(html, extensions);
}

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
	return generateHTML(content, extensions);
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
