<script lang="ts">
	/**
	 * Salary Section - Config-driven component with number inputs
	 * Only shows if not hidden in config, marks as required based on config
	 */
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { CURRENCIES } from '$lib/features/jobs/constants';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import type { PublicJobPostingFields } from '../types';
	import type { JobBoardConfig } from '$lib/config/jobs/schema.server';

	let { fields, config }: { fields: PublicJobPostingFields; config: JobBoardConfig } = $props();

	// Only show section if not hidden
	const showSection = $derived(config.fields.salary.mode !== 'hidden');

	// Mark as required if config says so
	const isRequired = $derived(config.fields.salary.mode === 'required');

	const currencies = CURRENCIES;

	// Reactive: Get current values from form fields
	const selectedCurrency = $derived(fields.salary?.currency?.value ? fields.salary.currency.value() : 'USD');
	const minSalary = $derived(fields.salary?.min?.value ? fields.salary.min.value() : undefined);
	const maxSalary = $derived(fields.salary?.max?.value ? fields.salary.max.value() : undefined);

	const currencyLabel = $derived(currencies.find((c) => c === selectedCurrency) ?? 'USD');
</script>

{#if showSection && fields.salary}
	<Field.Set>
		<Field.Legend>Salary Range {isRequired ? '*' : ''}</Field.Legend>
		<Field.Description>
			{#if isRequired}
				Specify the annual salary range for this position
			{:else}
				Optionally specify the annual salary range for this position
			{/if}
		</Field.Description>
		<Field.Separator />
		<Field.Group class="@container/field-group">
			<!-- Min Salary -->
			<Field.Field
				orientation="responsive"
				data-invalid={getFormFieldIssues(fields.salary.min).length > 0}
				class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
			>
				<Field.Content>
					<Field.Label for="salary-min">Minimum Salary {isRequired ? '*' : ''}</Field.Label>
					<Field.Description>Annual minimum salary amount</Field.Description>
				</Field.Content>
				<div class="flex flex-col gap-2">
					<Input
						id="salary-min"
						type="number"
						min={0}
						step={1000}
						placeholder="e.g., 50000"
						value={minSalary}
						oninput={(e) => {
							const val = e.currentTarget.value;
							if (fields.salary?.min) {
								fields.salary.min.set(val === '' ? undefined : Number(val));
							}
						}}
					/>
					{#each getFormFieldIssues(fields.salary.min) as issue, i (i)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				</div>
			</Field.Field>
			<Field.Separator />

			<!-- Max Salary -->
			<Field.Field
				orientation="responsive"
				data-invalid={getFormFieldIssues(fields.salary.max).length > 0}
				class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
			>
				<Field.Content>
					<Field.Label for="salary-max">Maximum Salary {isRequired ? '*' : ''}</Field.Label>
					<Field.Description>Annual maximum salary amount</Field.Description>
				</Field.Content>
				<div class="flex flex-col gap-2">
					<Input
						id="salary-max"
						type="number"
						min={0}
						step={1000}
						placeholder="e.g., 150000"
						value={maxSalary}
						oninput={(e) => {
							const val = e.currentTarget.value;
							if (fields.salary?.max) {
								fields.salary.max.set(val === '' ? undefined : Number(val));
							}
						}}
					/>
					{#each getFormFieldIssues(fields.salary.max) as issue, i (i)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				</div>
			</Field.Field>
			<Field.Separator />

			<!-- Currency -->
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
							if (v && fields.salary?.currency) fields.salary.currency.set(v as any);
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
{/if}
