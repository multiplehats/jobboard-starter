<script lang="ts">
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import type { RemoteFormIssue } from '@sveltejs/kit';

	type Props = {
		class?: string;
		issues: RemoteFormIssue[];
		titleClass?: string;
		title: string;
		description: string;
	};

	let { issues, title, description, titleClass, class: className }: Props = $props();
</script>

{#if issues.length > 0}
	<Alert.Root variant="destructive" class={className}>
		<CircleAlertIcon class="size-4" />

		<Alert.Title class={titleClass}>
			{title}
		</Alert.Title>
		<Alert.Description>
			<p class="mb-2">
				{description}
			</p>
			<ul class="list-inside list-disc">
				{#each issues as issue, i (i)}
					<li>{issue.message}</li>
				{/each}
			</ul>
		</Alert.Description>
	</Alert.Root>
{/if}
