<script lang="ts">
	/**
	 * Salary Section - Simplified to work directly with form fields
	 * No intermediate state - reads with .value(), writes with .set()
	 */
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { CURRENCIES } from '$lib/features/jobs/constants';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import type { PublicJobPostingFields } from '../types';

	let { fields }: { fields: PublicJobPostingFields } = $props();

	const currencies = CURRENCIES;

	// Reactive: Get current values from form fields
	const selectedCurrency = $derived(fields.salary.currency.value());

	// Reactive: Get salary range from form fields
	const salaryRange = $derived.by(() => {
		const min = fields.salary.min.value();
		const max = fields.salary.max.value();
		// Return as tuple [number, number] for the slider
		return [Number(min) || 0, Number(max) || 500000] as [number, number];
	});

	const currencyLabel = $derived(currencies.find((c) => c === selectedCurrency) ?? 'USD');
</script>

<Field.Set>
	<Field.Legend>Salary Range</Field.Legend>
	<Field.Description>Optionally specify the annual salary range for this position</Field.Description>
	<Field.Separator />
	<Field.Group class="@container/field-group">
		<Field.Field
			orientation="responsive"
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label>Annual Salary Range</Field.Label>
				<Field.Description>
					${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
					{selectedCurrency}
					per year
				</Field.Description>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<Slider
					type="multiple"
					value={salaryRange}
					onValueChange={(v) => {
						if (v && Array.isArray(v) && v.length === 2) {
							fields.salary.min.set(v[0]);
							fields.salary.max.set(v[1]);
						}
					}}
					max={500000}
					min={0}
					step={5000}
					class="w-full"
					aria-label="Salary Range"
				/>
				{#each getFormFieldIssues(fields.salary.min) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
				{#each getFormFieldIssues(fields.salary.max) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
		<Field.Separator />
		<Field.Field
			orientation="responsive"
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label for="salary-currency">Currency</Field.Label>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<Select.Root
					type="single"
					value={selectedCurrency}
					onValueChange={(v) => {
						if (v) fields.salary.currency.set(v as any);
					}}
				>
					<Select.Trigger id="salary-currency">
						{currencyLabel}
					</Select.Trigger>
					<Select.Content>
						{#each currencies as currency (currency)}
							<Select.Item value={currency}>{currency}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</Field.Field>
	</Field.Group>
</Field.Set>
