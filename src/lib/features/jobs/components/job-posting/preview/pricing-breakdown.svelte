<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import type { PricingBreakdownProps } from '../types';

	let { pricing, selectedUpsells, totalPrice, currency }: PricingBreakdownProps = $props();
</script>

<Item.Root variant="outline">
	<Item.Header>
		<Item.Title>Total</Item.Title>
		<Item.Description class="text-pretty">${totalPrice} {currency}</Item.Description>
	</Item.Header>
	<Item.Footer class="block text-xs">
		Job post will be <span class="font-medium">pinned</span> for {pricing.duration} days.
	</Item.Footer>
</Item.Root>
