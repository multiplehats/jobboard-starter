<script lang="ts">
	/**
	 * Location Section - Simplified to work directly with form fields
	 * No intermediate state - reads with .value(), writes with .set()
	 */
	import * as Field from '$lib/components/ui/field/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { locationTypesList } from '$lib/features/jobs/constants';
	import TimezonePicker from '$lib/components/timezone-picker.svelte';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import type { PublicJobPostingFields } from '../types';

	let { fields }: { fields: PublicJobPostingFields } = $props();

	const locationTypes = locationTypesList();

	// Reactive: Get current values from form fields
	const selectedLocationType = $derived(fields.locationType.value());
	const selectedHiringLocationType = $derived(fields.hiringLocation.type.value());
	const selectedTimezones = $derived(fields.hiringLocation.timezones.value() || []);
</script>

<Field.Set>
	<Field.Legend>Location & Work Arrangement</Field.Legend>
	<Field.Description>Specify where and how the work will be performed</Field.Description>
	<Field.Separator />
	<Field.Group class="@container/field-group">
		<!-- Location Type -->
		<Field.Field
			orientation="responsive"
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label for="location-type">Location Type *</Field.Label>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<RadioGroup.Root
					value={selectedLocationType}
					onValueChange={(v) => {
						if (v) fields.locationType.set(v as any);
					}}
				>
					{#each locationTypes as locType (locType.value)}
						<Field.Field orientation="horizontal">
							<RadioGroup.Item value={locType.value} id="location-{locType.value}" />
							<Field.Label for="location-{locType.value}" class="font-normal">
								{locType.label}
							</Field.Label>
						</Field.Field>
					{/each}
				</RadioGroup.Root>
			</div>
		</Field.Field>
		<Field.Separator />

		<!-- Hiring Location Type -->
		<Field.Field
			orientation="responsive"
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label>Hiring Location *</Field.Label>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<RadioGroup.Root
					value={selectedHiringLocationType}
					onValueChange={(v) => {
						if (v) fields.hiringLocation.type.set(v as any);
					}}
				>
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="worldwide" id="hiring-worldwide" />
						<Field.Label for="hiring-worldwide" class="font-normal">
							Worldwide - Hire from anywhere
						</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="timezone" id="hiring-timezone" />
						<Field.Label for="hiring-timezone" class="font-normal"> Specific Timezones </Field.Label>
					</Field.Field>
				</RadioGroup.Root>
			</div>
		</Field.Field>

		{#if selectedHiringLocationType === 'timezone'}
			<Field.Separator />
			<Field.Field
				orientation="responsive"
				data-invalid={getFormFieldIssues(fields.hiringLocation.timezones).length > 0}
				class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
			>
				<Field.Content>
					<Field.Label for="timezones">Allowed Timezones *</Field.Label>
					<Field.Description>Select one or more timezones where you're hiring</Field.Description>
				</Field.Content>
				<div class="flex flex-col gap-2">
					<TimezonePicker
						value={selectedTimezones}
						onchange={(v: string[]) => fields.hiringLocation.timezones.set(v)}
						placeholder="Select timezones..."
						class="w-full"
					/>
					{#each getFormFieldIssues(fields.hiringLocation.timezones) as issue, i (i)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				</div>
			</Field.Field>
		{/if}
	</Field.Group>
</Field.Set>
