<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { SvelteSet } from 'svelte/reactivity';
	import { formatPrice } from '$lib/utils/currency';
	import type { UpsellsSectionProps } from '../types';

	let {
		fields,
		enabledUpsells,
		selectedUpsells = $bindable(),
		onSelectedUpsellsChange
	}: UpsellsSectionProps = $props();

	// Get currency from first upsell (they all share the same currency from pricing config)
	const currency = enabledUpsells[0]?.currency || 'USD';
</script>

{#if enabledUpsells.length > 0}
	<Field.Set>
		<Field.Legend>Upgrades</Field.Legend>
		<Field.Description>Enhance your job posting visibility</Field.Description>
		<Field.Separator />
		<Field.Group class="@container/field-group gap-4">
			{#each enabledUpsells as upsell (upsell.id)}
				<div
					class="rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
				>
					<Field.Field orientation="horizontal" class="items-start gap-3">
						<Checkbox
							id="upsell-{upsell.id}"
							checked={selectedUpsells.has(upsell.id)}
							onchange={(e) => {
								const target = e.currentTarget as HTMLInputElement;
								const checked = target.checked;
								if (checked) {
									selectedUpsells.add(upsell.id);
								} else {
									selectedUpsells.delete(upsell.id);
								}
								selectedUpsells = new SvelteSet(selectedUpsells);
							}}
							class="mt-1"
						/>
						<Field.Content class="space-y-1">
							<Field.Label for="upsell-{upsell.id}" class="text-base leading-none font-semibold">
								{upsell.name}
								<Badge variant="secondary" class="ml-2">+{formatPrice(upsell.price, currency)}</Badge>
								{#if upsell.badge}
									<Badge variant="outline" class="ml-1">{upsell.badge}</Badge>
								{/if}
							</Field.Label>
							<Field.Description class="text-sm">
								{upsell.description}
							</Field.Description>
						</Field.Content>
					</Field.Field>
				</div>
			{/each}
		</Field.Group>
		<!-- Hidden field to submit selected upsells as array -->
		<input
			{...fields.selectedUpsells.as('select multiple')}
			type="hidden"
			value={Array.from(selectedUpsells)}
		/>
	</Field.Set>
{/if}
