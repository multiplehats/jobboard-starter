<script lang="ts">
	/**
	 * Simple Tiptap JSON renderer component
	 * Renders Tiptap JSON content as HTML
	 */
	interface TiptapNode {
		type: string;
		content?: TiptapNode[];
		text?: string;
		attrs?: Record<string, unknown>;
		marks?: { type: string; attrs?: Record<string, unknown> }[];
	}

	interface Props {
		content: unknown;
		class?: string;
	}

	let { content, class: className }: Props = $props();

	function parseContent(json: unknown): string {
		if (!json || typeof json !== 'object') {
			return '';
		}

		const node = json as TiptapNode;

		if (node.type === 'text') {
			let text = node.text || '';

			// Apply marks (bold, italic, etc.)
			if (node.marks) {
				for (const mark of node.marks) {
					if (mark.type === 'bold') {
						text = `<strong>${text}</strong>`;
					} else if (mark.type === 'italic') {
						text = `<em>${text}</em>`;
					} else if (mark.type === 'code') {
						text = `<code>${text}</code>`;
					} else if (mark.type === 'link') {
						const href = mark.attrs?.href || '#';
						text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
					}
				}
			}

			return text;
		}

		if (!node.content || !Array.isArray(node.content)) {
			return '';
		}

		const children = node.content.map((child) => parseContent(child)).join('');

		// Wrap content in appropriate tags
		switch (node.type) {
			case 'doc':
				return children;
			case 'paragraph':
				return `<p>${children}</p>`;
			case 'heading':
				const level = (node.attrs?.level as number) || 1;
				return `<h${level}>${children}</h${level}>`;
			case 'bulletList':
				return `<ul>${children}</ul>`;
			case 'orderedList':
				return `<ol>${children}</ol>`;
			case 'listItem':
				return `<li>${children}</li>`;
			case 'blockquote':
				return `<blockquote>${children}</blockquote>`;
			case 'codeBlock':
				return `<pre><code>${children}</code></pre>`;
			case 'hardBreak':
				return '<br>';
			case 'horizontalRule':
				return '<hr>';
			default:
				return children;
		}
	}

	const htmlContent = $derived(parseContent(content));
</script>

<div class={className}>
	{@html htmlContent}
</div>

<style>
	div :global(p) {
		margin-bottom: 1rem;
	}

	div :global(p:last-child) {
		margin-bottom: 0;
	}

	div :global(h1),
	div :global(h2),
	div :global(h3),
	div :global(h4),
	div :global(h5),
	div :global(h6) {
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}

	div :global(h1) {
		font-size: 2rem;
	}

	div :global(h2) {
		font-size: 1.5rem;
	}

	div :global(h3) {
		font-size: 1.25rem;
	}

	div :global(ul),
	div :global(ol) {
		margin-left: 1.5rem;
		margin-bottom: 1rem;
	}

	div :global(li) {
		margin-bottom: 0.25rem;
	}

	div :global(blockquote) {
		border-left: 4px solid hsl(var(--border));
		padding-left: 1rem;
		margin: 1rem 0;
		color: hsl(var(--muted-foreground));
	}

	div :global(code) {
		background: hsl(var(--muted));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}

	div :global(pre) {
		background: hsl(var(--muted));
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	div :global(pre code) {
		background: none;
		padding: 0;
	}

	div :global(a) {
		color: hsl(var(--primary));
		text-decoration: underline;
	}

	div :global(hr) {
		margin: 1.5rem 0;
		border: none;
		border-top: 1px solid hsl(var(--border));
	}
</style>
