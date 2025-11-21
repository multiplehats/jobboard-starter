<script lang="ts">
	/**
	 * Working Permits Section - Simplified to work directly with form fields
	 * No intermediate state - reads with .value(), writes with .set()
	 */
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import type { PublicJobPostingFields } from '../types';

	let { fields }: { fields: PublicJobPostingFields } = $props();

	// Reactive: Get current value from form field
	const selectedWorkingPermitsType = $derived(fields.workingPermits.type.value());
</script>

<Field.Set>
	<Field.Legend>Working Permits</Field.Legend>
	<Field.Description>Specify any visa or work permit requirements</Field.Description>
	<Field.Separator />
	<Field.Group class="@container/field-group">
		<Field.Field
			orientation="responsive"
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label>Working Permits Type *</Field.Label>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<RadioGroup.Root
					value={selectedWorkingPermitsType}
					onValueChange={(v) => {
						if (v) fields.workingPermits.type.set(v as any);
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
							Specific permits required
						</Field.Label>
					</Field.Field>
				</RadioGroup.Root>
			</div>
		</Field.Field>

		{#if selectedWorkingPermitsType === 'required'}
			<Field.Separator />
			<Field.Field
				orientation="responsive"
				class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
			>
				<Field.Content>
					<Field.Label for="required-permits">Required Permits</Field.Label>
					<Field.Description>Enter required permits separated by commas</Field.Description>
				</Field.Content>
				<div class="flex flex-col gap-2">
					<Input
						id="required-permits"
						placeholder="e.g., US Work Authorization, EU Work Permit (comma separated)"
						{...fields.workingPermits.permits.as('select multiple')}
					/>
				</div>
			</Field.Field>
		{/if}
	</Field.Group>
</Field.Set>
