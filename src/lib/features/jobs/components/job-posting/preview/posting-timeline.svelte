<script lang="ts">
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import SearchCheckIcon from '@lucide/svelte/icons/search-check';
	import RocketIcon from '@lucide/svelte/icons/rocket';
	import MailIcon from '@lucide/svelte/icons/mail';

	interface Props {
		duration: number;
	}

	let { duration }: Props = $props();

	const timeline = [
		{
			icon: CheckCircleIcon,
			title: 'Payment Confirmed',
			description: 'Your order is received and processing',
			color: 'text-green-500 bg-green-500/10'
		},
		{
			icon: SearchCheckIcon,
			title: 'Review & Approval',
			description: 'We review your job posting for quality',
			color: 'text-blue-500 bg-blue-500/10'
		},
		{
			icon: RocketIcon,
			title: 'Job Goes Live',
			description: 'Published within 6-12 hours after payment',
			color: 'text-purple-500 bg-purple-500/10'
		},
		{
			icon: MailIcon,
			title: 'Start Receiving Applications',
			description: 'Connect with qualified candidates',
			color: 'text-orange-500 bg-orange-500/10'
		}
	];
</script>

<div class="space-y-2">
	<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What Happens Next</p>

	<div class="space-y-3">
		{#each timeline as item, index}
			<div class="flex gap-3">
				<!-- Timeline Line -->
				<div class="flex flex-col items-center">
					<div class="flex h-8 w-8 items-center justify-center rounded-full {item.color}">
						<svelte:component this={item.icon} class="h-4 w-4" />
					</div>
					{#if index < timeline.length - 1}
						<div class="my-1 w-0.5 flex-1 bg-gradient-to-b from-border to-transparent"></div>
					{/if}
				</div>

				<!-- Content -->
				<div class="flex-1 pb-4">
					<p class="text-sm font-semibold text-foreground">{item.title}</p>
					<p class="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
				</div>
			</div>
		{/each}
	</div>
</div>
