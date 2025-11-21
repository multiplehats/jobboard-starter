import { describe, it, expect } from 'vitest';
import { htmlToTiptapJson } from './tiptap';

describe('htmlToTiptapJson', () => {
	it('converts HTML headings to Tiptap JSON', () => {
		const html = '<h2>Hello World</h2>';
		const result = htmlToTiptapJson(html);

		expect(result).toHaveProperty('type', 'doc');
		expect(result).toHaveProperty('content');
		expect(Array.isArray(result.content)).toBe(true);
	});

	it('converts HTML with lists and bold text', () => {
		const html = `<h2>Key Responsibilities</h2>
<ul>
<li>Develop innovative solutions</li>
<li><strong>Collaborate</strong> with teams</li>
<li>Ensure quality standards</li>
</ul>`;

		const result = htmlToTiptapJson(html);

		expect(result.type).toBe('doc');
		expect(result.content).toBeDefined();
		expect(result.content!.length).toBeGreaterThan(0);
	});

	it('handles empty HTML', () => {
		const result = htmlToTiptapJson('');

		expect(result).toEqual({ type: 'doc', content: [] });
	});

	it('converts complex job description HTML', () => {
		const html = `<h2>Overview</h2>
<p>This is a great opportunity.</p>
<h2>Responsibilities</h2>
<ul>
<li>Design features</li>
<li>Write code</li>
<li>Review PRs</li>
</ul>
<h2>Requirements</h2>
<ul>
<li><strong>5+ years</strong> experience</li>
<li>Strong communication skills</li>
</ul>`;

		const result = htmlToTiptapJson(html);

		expect(result.type).toBe('doc');
		expect(result.content).toBeDefined();
		// Should have at least one node
		expect(result.content!.length).toBeGreaterThan(0);
	});
});
