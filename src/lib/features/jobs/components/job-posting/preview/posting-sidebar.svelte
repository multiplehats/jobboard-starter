<script lang="ts">
	import LiveJobPreview from './live-job-preview.svelte';
	import PostingTimeline from './posting-timeline.svelte';
	import PriceCalculator from './price-calculator.svelte';
	import TrustBadges from './trust-badges.svelte';
	import type { OrderSummaryProps } from '../types';

	let { pricing, previewData, totalPrice, selectedUpsells }: OrderSummaryProps = $props();
</script>

<div class="relative flex h-full w-full flex-col gap-6 p-6">
	<!-- Live Preview -->
	<div class="space-y-2">
		<LiveJobPreview {previewData} />
	</div>

	<!-- Price Breakdown -->
	<PriceCalculator {pricing} {selectedUpsells} {totalPrice} />

	<!-- Posting Timeline -->
	<PostingTimeline duration={pricing.duration} />

	<!-- Trust Badges -->
	<TrustBadges />

	<!-- Bottom CTA - only shown on shorter screens -->
	<div
		class="sticky bottom-0 -mx-6 mt-auto -mb-6 border-t bg-background/95 p-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 [@media(min-height:900px)]:hidden"
	>
		<button
			type="button"
			class="w-full rounded-lg bg-gradient-to-r from-primary to-primary/80 px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
		>
			Continue to Checkout
		</button>
	</div>
</div>
