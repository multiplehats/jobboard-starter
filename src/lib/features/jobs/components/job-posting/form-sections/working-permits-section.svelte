<script lang="ts">
	/**
	 * Working Permits Section - Config-driven component
	 * Only shows if not hidden in config, marks as required based on config
	 */
	import * as Field from '$lib/components/ui/field/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import CountryPicker from '$lib/components/country-picker.svelte';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import type { PublicJobPostingFields } from '../types';
	import type { JobBoardConfig } from '$lib/config/jobs/schema.server';

	let { fields, config }: { fields: PublicJobPostingFields; config: JobBoardConfig } = $props();

	// Only show section if not hidden
	const showSection = $derived(config.fields.workingPermits.mode !== 'hidden');

	// Mark as required if config says so
	const isRequired = $derived(config.fields.workingPermits.mode === 'required');

	// Reactive: Get current value from form field
	const selectedWorkingPermitsType = $derived(
		fields.workingPermits?.type?.value ? fields.workingPermits.type.value() : undefined
	);

	// Get selected countries for permits - initialize from form or with empty picker
	let selectedPermitCountries = $state<string[]>([]);

	// Initialize selected countries from form value
	$effect(() => {
		const currentValue = fields.workingPermits?.permits?.value
			? fields.workingPermits.permits.value() || []
			: [];

		// Only initialize if we haven't set any values yet
		if (selectedPermitCountries.length === 0) {
			selectedPermitCountries = currentValue.length > 0 ? currentValue : [''];
		}
	});

	// Add a new permit country
	function addPermitCountry() {
		selectedPermitCountries = [...selectedPermitCountries, ''];
	}

	// Remove a permit country
	function removePermitCountry(index: number) {
		selectedPermitCountries = selectedPermitCountries.filter((_, i) => i !== index);
		updatePermitsField();
	}

	// Update a permit country
	function updatePermitCountry(index: number, countryCode: string) {
		selectedPermitCountries[index] = countryCode;
		selectedPermitCountries = [...selectedPermitCountries]; // Trigger reactivity
		updatePermitsField();
	}

	// Update the permits field with selected countries
	function updatePermitsField() {
		if (fields.workingPermits?.permits) {
			// Filter out empty strings
			const validCountries = selectedPermitCountries.filter((c) => c.trim() !== '');
			fields.workingPermits.permits.set(validCountries);
		}
	}
</script>

{#if showSection && fields.workingPermits}
	<Field.Set>
		<Field.Legend>Working Permits {isRequired ? '*' : ''}</Field.Legend>
		<Field.Description>
			{#if isRequired}
				Specify any visa or work permit requirements for this position
			{:else}
				Optionally specify any visa or work permit requirements
			{/if}
		</Field.Description>
		<Field.Separator />
		<Field.Group class="@container/field-group">
			<Field.Field
				orientation="responsive"
				class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
			>
				<Field.Content>
					<Field.Label>Working Permits Type {isRequired ? '*' : ''}</Field.Label>
				</Field.Content>
				<div class="flex flex-col gap-2">
					<RadioGroup.Root
						value={selectedWorkingPermitsType}
						onValueChange={(v) => {
							if (v && fields.workingPermits?.type) fields.workingPermits.type.set(v as any);
						}}
					>
						<Field.Field orientation="horizontal">
							<RadioGroup.Item value="no-specific" id="permits-none" />
							<Field.Label for="permits-none" class="font-normal">
								No specific requirements
							</Field.Label>
						</Field.Field>
						<Field.Field orientation="horizontal">
							<RadioGroup.Item value="required" id="permits-required" />
							<Field.Label for="permits-required" class="font-normal">
								Must be eligible to work in specific countries
							</Field.Label>
						</Field.Field>
					</RadioGroup.Root>
				</div>
			</Field.Field>

			{#if selectedWorkingPermitsType === 'required' && fields.workingPermits.permits}
				<Field.Separator />
				<Field.Field
					orientation="responsive"
					data-invalid={getFormFieldIssues(fields.workingPermits.permits).length > 0}
					class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
				>
					<Field.Content>
						<Field.Label>Required Work Permits *</Field.Label>
						<Field.Description>
							Select countries where candidates must be eligible to work
						</Field.Description>
					</Field.Content>
					<div class="flex flex-col gap-3">
						{#each selectedPermitCountries as countryCode, index (index)}
							<div class="flex items-center gap-2">
								<div class="flex-1">
									<CountryPicker
										value={countryCode ? [countryCode] : []}
										onchange={(value) => {
											updatePermitCountry(index, value[0] || '');
										}}
										multiple={false}
										placeholder="Select country..."
									/>
								</div>
								{#if selectedPermitCountries.length > 1}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => removePermitCountry(index)}
										class="shrink-0"
									>
										Remove
									</Button>
								{/if}
							</div>
						{/each}

						<Button type="button" variant="link" onclick={addPermitCountry} class="self-start px-0">
							+ Add another permit
						</Button>

						{#each getFormFieldIssues(fields.workingPermits.permits) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</div>
				</Field.Field>
			{/if}
		</Field.Group>
	</Field.Set>
{/if}
