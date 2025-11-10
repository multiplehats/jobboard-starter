<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { cn } from '$lib/utils/ui.js';
	import ToolBarIcon from './components/toolbar-icon.svelte';

	// Icons
	import Undo from '@lucide/svelte/icons/undo-2';
	import Redo from '@lucide/svelte/icons/redo-2';
	import Heading2 from '@lucide/svelte/icons/heading-2';
	import Heading3 from '@lucide/svelte/icons/heading-3';
	import Link from '@lucide/svelte/icons/link-2';
	import Bold from '@lucide/svelte/icons/bold';
	import Italic from '@lucide/svelte/icons/italic';
	import Underline from '@lucide/svelte/icons/underline';
	import List from '@lucide/svelte/icons/list';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';

	interface Props {
		editor: Editor;
		class?: string;
	}

	let { editor, class: className }: Props = $props();

	const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

	// Minimal command set for job descriptions
	const commands = [
		// Undo/Redo
		{
			icon: Undo,
			name: 'undo',
			tooltip: 'Undo',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}Z`,
			onClick: (editor: Editor) => editor.chain().focus().undo().run(),
			clickable: (editor: Editor) => editor.can().undo()
		},
		{
			icon: Redo,
			name: 'redo',
			tooltip: 'Redo',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}Y`,
			onClick: (editor: Editor) => editor.chain().focus().redo().run(),
			clickable: (editor: Editor) => editor.can().redo()
		},
		// Headings (H2, H3 only - no H1)
		{
			icon: Heading2,
			name: 'h2',
			tooltip: 'Heading 2',
			shortCut: `${isMac ? '⌘⌥' : 'Ctrl+Alt+'}2`,
			onClick: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
			clickable: (editor: Editor) => editor.can().toggleHeading({ level: 2 }),
			isActive: (editor: Editor) => editor.isActive('heading', { level: 2 })
		},
		{
			icon: Heading3,
			name: 'h3',
			tooltip: 'Heading 3',
			shortCut: `${isMac ? '⌘⌥' : 'Ctrl+Alt+'}3`,
			onClick: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
			clickable: (editor: Editor) => editor.can().toggleHeading({ level: 3 }),
			isActive: (editor: Editor) => editor.isActive('heading', { level: 3 })
		},
		// Text Formatting
		{
			icon: Bold,
			name: 'bold',
			tooltip: 'Bold',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}B`,
			onClick: (editor: Editor) => editor.chain().focus().toggleBold().run(),
			clickable: (editor: Editor) => editor.can().toggleBold(),
			isActive: (editor: Editor) => editor.isActive('bold')
		},
		{
			icon: Italic,
			name: 'italic',
			tooltip: 'Italic',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}I`,
			onClick: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
			clickable: (editor: Editor) => editor.can().toggleItalic(),
			isActive: (editor: Editor) => editor.isActive('italic')
		},
		{
			icon: Underline,
			name: 'underline',
			tooltip: 'Underline',
			shortCut: `${isMac ? '⌘' : 'Ctrl+'}U`,
			onClick: (editor: Editor) => editor.chain().focus().toggleUnderline().run(),
			clickable: (editor: Editor) => editor.can().toggleUnderline(),
			isActive: (editor: Editor) => editor.isActive('underline')
		},
		// Link
		{
			icon: Link,
			name: 'link',
			tooltip: 'Link',
			onClick: (editor: Editor) => {
				if (editor.isActive('link')) {
					editor.chain().focus().unsetLink().run();
				} else {
					const url = window.prompt('Enter the URL:');
					if (url) {
						editor.chain().focus().toggleLink({ href: url }).run();
					}
				}
			},
			isActive: (editor: Editor) => editor.isActive('link')
		},
		// Lists
		{
			icon: List,
			name: 'bulletList',
			tooltip: 'Bullet List',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}8`,
			onClick: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
			isActive: (editor: Editor) => editor.isActive('bulletList')
		},
		{
			icon: ListOrdered,
			name: 'orderedList',
			tooltip: 'Numbered List',
			shortCut: `${isMac ? '⌘⇧' : 'Ctrl+Shift+'}7`,
			onClick: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
			isActive: (editor: Editor) => editor.isActive('orderedList')
		}
	];
</script>

<div class={cn('edra-toolbar flex gap-0.5', className)}>
	{#each commands as command (command.name)}
		<ToolBarIcon {editor} {command} />
	{/each}
</div>
