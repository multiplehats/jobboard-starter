<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { PricingBreakdownProps } from '../types';
	import { cn } from '$lib/utils/ui';
	import { formatPrice } from '$lib/utils/currency';

	let { pricing, selectedUpsells, totalPrice }: PricingBreakdownProps = $props();
</script>

<div class="space-y-3 rounded-lg border bg-card p-4">
	<div class="flex items-center justify-between border-b pb-2">
		<p class="text-sm font-medium text-muted-foreground">Price Breakdown</p>
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
			<rect width="20" height="14" x="2" y="5" rx="2"/>
			<line x1="2" x2="22" y1="10" y2="10"/>
		</svg>
	</div>

	<!-- Base Price -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
				<CheckIcon class="h-3 w-3 text-primary" />
			</div>
			<span class="text-sm text-foreground">Job Posting ({pricing.duration} days)</span>
		</div>
		<span class="font-semibold text-foreground">{formatPrice(pricing.price, pricing.currency)}</span>
	</div>

	<!-- Upsells -->
	{#each pricing.upsells.filter(u => u.enabled) as upsell (upsell.id)}
		{@const isSelected = selectedUpsells.has(upsell.id)}
		<div class={cn("flex items-center justify-between transition-opacity", !isSelected && "opacity-40")}>
			<div class="flex items-center gap-2">
				<div class={cn("flex h-5 w-5 items-center justify-center rounded-full", isSelected ? "bg-primary/10" : "bg-muted")}>
					{#if isSelected}
						<CheckIcon class="h-3 w-3 text-primary" />
					{:else}
						<div class="h-2 w-2 rounded-full border-2 border-muted-foreground"></div>
					{/if}
				</div>
				<span class={cn("text-sm", isSelected ? "text-foreground" : "text-muted-foreground")}>
					{upsell.name}
				</span>
			</div>
			{#if isSelected}
				<span class="font-semibold text-foreground">+{formatPrice(upsell.price, pricing.currency)}</span>
			{:else}
				<span class="text-sm text-muted-foreground">{formatPrice(upsell.price, pricing.currency)}</span>
			{/if}
		</div>
	{/each}

	<!-- Total -->
	<div class="flex items-center justify-between border-t pt-3">
		<span class="font-semibold text-foreground">Total</span>
		<div class="flex items-baseline gap-1">
			<span class="text-2xl font-bold text-primary">{formatPrice(totalPrice, pricing.currency)}</span>
		</div>
	</div>
</div>
