<script lang="ts">
	import type { Content } from '@tiptap/core';
	import { tiptapJsonToHtml } from '$lib/utils/tiptap';

	interface Props {
		/**
		 * Tiptap JSON content from database
		 */
		content: Content | string;
		class?: string;
	}

	let { content, class: className }: Props = $props();

	// Convert JSON to HTML for display
	const html = $derived(tiptapJsonToHtml(content));
</script>

<!--
  Render the HTML content
  The prose class provides good typography defaults
-->
<div class="prose prose-sm max-w-none dark:prose-invert {className}">
	{@html html}
</div>
