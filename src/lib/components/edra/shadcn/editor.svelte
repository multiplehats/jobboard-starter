<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { EdraEditorProps } from '../types.js';
	import initEditor from '../editor.js';
	import { focusEditor } from '../utils.js';
	import { cn } from '$lib/utils/ui.js';
	import '../editor.css';
	import './style.css';
	import '../onedark.css';
	import { ImagePlaceholder } from '../extensions/image/image-placeholder.js';
	import ImagePlaceholderComp from './components/image-placeholder.svelte';
	import { ImageExtended } from '../extensions/image/image-extended.js';
	import ImageExtendedComp from './components/image-extended.svelte';
	import { VideoPlaceholder } from '../extensions/video/video-placeholder.js';
	import VideoPlaceHolderComp from './components/video-placeholder.svelte';
	import { VideoExtended } from '../extensions/video/video-extended.js';
	import VideoExtendedComp from './components/video-extended.svelte';
	import { AudioPlaceholder } from '../extensions/audio/audio-placeholder.js';
	import { AudioExtended } from '../extensions/audio/audio-extended.js';
	import AudioPlaceHolderComp from './components/audio-placeholder.svelte';
	import AudioExtendedComp from './components/audio-extended.svelte';
	import { IFramePlaceholder } from '../extensions/iframe/iframe-placeholder.js';
	import { IFrameExtended } from '../extensions/iframe/iframe-extended.js';
	import IFramePlaceHolderComp from './components/iframe-placeholder.svelte';
	import IFrameExtendedComp from './components/iframe-extended.svelte';
	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import { all, createLowlight } from 'lowlight';
	import { SvelteNodeViewRenderer } from 'svelte-tiptap';
	import CodeBlock from './components/code-block.svelte';
	import TableCol from './menus/table-col.svelte';
	import TableRow from './menus/table-row.svelte';
	import Link from './menus/link.svelte';
	import slashcommand from '../extensions/slash-command/slashcommand.js';
	import SlashCommandList from './components/slash-command-list.svelte';

	const lowlight = createLowlight(all);

	/**
	 * Bind the element to the editor
	 */
	let element = $state<HTMLElement>();
	let {
		editor = $bindable(),
		editable = true,
		content,
		onUpdate,
		autofocus = false,
		class: className
	}: EdraEditorProps = $props();

	onMount(() => {
		editor = initEditor(
			element,
			content,
			[
				CodeBlockLowlight.configure({
					lowlight
				}).extend({
					addNodeView() {
						return SvelteNodeViewRenderer(CodeBlock);
					}
				}),
				ImagePlaceholder(ImagePlaceholderComp),
				ImageExtended(ImageExtendedComp),
				VideoPlaceholder(VideoPlaceHolderComp),
				VideoExtended(VideoExtendedComp),
				AudioPlaceholder(AudioPlaceHolderComp),
				AudioExtended(AudioExtendedComp),
				IFramePlaceholder(IFramePlaceHolderComp),
				IFrameExtended(IFrameExtendedComp),
				slashcommand(SlashCommandList)
			],
			{
				onUpdate,
				onTransaction(props) {
					editor = undefined;
					editor = props.editor;
				},
				editable,
				autofocus
			}
		);
	});

	onDestroy(() => {
		if (editor) editor.destroy();
	});
</script>

{#if editor && !editor.isDestroyed}
	<Link {editor} />
	<TableCol {editor} />
	<TableRow {editor} />
{/if}
<div
	bind:this={element}
	role="button"
	tabindex="0"
	onclick={(event) => focusEditor(editor, event)}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			focusEditor(editor, event);
		}
	}}
	class={cn('edra-editor h-full w-full cursor-auto *:outline-none', className)}
></div>
