<script lang="ts">
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import LockIcon from '@lucide/svelte/icons/lock';
	import ZapIcon from '@lucide/svelte/icons/zap';

	const badges = [
		{
			icon: ShieldCheckIcon,
			title: 'Secure Checkout',
			description: 'Powered by Stripe',
			color: 'text-blue-600'
		},
		{
			icon: LockIcon,
			title: 'SSL Protected',
			description: '256-bit encryption',
			color: 'text-green-600'
		},
		{
			icon: ZapIcon,
			title: 'Instant Activation',
			description: 'Live in seconds',
			color: 'text-orange-600'
		}
	];
</script>

<div class="space-y-3 rounded-lg border bg-muted/30 p-4">
	<p class="text-xs font-semibold text-muted-foreground">Trusted & Secure</p>

	<div class="grid gap-2">
		{#each badges as badge}
			<div class="flex items-center gap-2.5">
				<div class="flex h-7 w-7 items-center justify-center rounded-md bg-background">
					<svelte:component this={badge.icon} class="h-4 w-4 {badge.color}" />
				</div>
				<div class="flex-1">
					<p class="text-xs font-medium text-foreground">{badge.title}</p>
					<p class="text-[10px] text-muted-foreground">{badge.description}</p>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-3 flex items-center justify-center gap-2 border-t pt-3">
		<svg class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
			<path d="M2 10.5a1.5 1.5 0 1 1 3 0v6a1.5 1.5 0 1 1-3 0v-6zM6 10.333v5.43a2 2 0 0 0 1.106 1.79l.05.025A4 4 0 0 0 8.943 18h5.416a2 2 0 0 0 1.962-1.608l1.2-6A2 2 0 0 0 15.56 8H12V4a2 2 0 0 0-2-2 1 1 0 0 0-1 1v.667a4 4 0 0 1-.8 2.4L6.8 7.933a4 4 0 0 0-.8 2.4z"/>
		</svg>
		<p class="text-[10px] text-muted-foreground">
			Trusted by <strong>1,200+</strong> companies worldwide
		</p>
	</div>
</div>
