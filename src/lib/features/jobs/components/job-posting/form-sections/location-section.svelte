<script lang="ts">
	/**
	 * Location Section - Config-driven component
	 * Displays and validates location fields based on JobBoardConfig
	 */
	import * as Field from '$lib/components/ui/field/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { locationTypesList } from '$lib/features/jobs/constants';
	import TimezonePicker from '$lib/components/timezone-picker.svelte';
	import CountryPicker from '$lib/components/country-picker.svelte';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import { getCountryName } from '$lib/utils/countries';
	import type { PublicJobPostingFields } from '../types';
	import type { JobBoardConfig } from '$lib/config/jobs/schema.server';

	let { fields, config }: { fields: PublicJobPostingFields; config: JobBoardConfig } = $props();

	// Filter location types based on config
	const allLocationTypes = locationTypesList();
	const allowedLocationTypes = $derived(
		allLocationTypes.filter((lt) => config.allowedLocationTypes.includes(lt.value as any))
	);

	// Show radio group only if more than one option
	const showLocationTypeChoice = $derived(allowedLocationTypes.length > 1);

	// Reactive: Get current values from form fields
	const selectedLocationType = $derived(fields.locationType.value());
	const selectedHiringLocationType = $derived(
		fields.hiringLocation?.type?.value ? fields.hiringLocation.type.value() : undefined
	);

	// Manage timezones as a single multi-select picker
	let selectedTimezones = $state<string[]>([]);

	// Initialize timezones from form value
	$effect(() => {
		const currentValue = fields.hiringLocation?.timezones?.value
			? fields.hiringLocation.timezones.value() || []
			: [];

		// Sync with form value
		if (JSON.stringify(selectedTimezones) !== JSON.stringify(currentValue)) {
			selectedTimezones = currentValue;
		}
	});

	// Update the timezones field when selectedTimezones changes
	function updateTimezonesField(timezones: string[]) {
		if (fields.hiringLocation?.timezones) {
			fields.hiringLocation.timezones.set(timezones);
		}
	}

	// State for structured location input (city + country)
	let city = $state('');
	let selectedCountries = $state<string[]>([]);

	// Parse existing location value into city and country on mount
	$effect(() => {
		const currentLocation = fields.location?.value();
		if (currentLocation && !city && selectedCountries.length === 0) {
			// Try to parse location like "San Francisco, CA, USA" or "London, UK"
			const parts = currentLocation.split(',').map((p: string) => p.trim());
			if (parts.length >= 2) {
				// Last part is likely country, everything else is city/region
				const possibleCountry = parts[parts.length - 1];
				// Simple heuristic: if last part is 2-3 chars (country code), use it
				if (possibleCountry.length <= 3) {
					selectedCountries = [possibleCountry];
					city = parts.slice(0, -1).join(', ');
				} else {
					// Otherwise, just use first part as city
					city = parts[0];
				}
			} else {
				city = currentLocation;
			}
		}
	});

	// Update the location field when city or country changes
	function updateLocationField() {
		if (!fields.location) return;

		const countryName = selectedCountries.length > 0 ? getCountryName(selectedCountries[0]) : '';
		const locationParts = [city, countryName].filter((part) => part && part.trim().length > 0);
		const locationString = locationParts.join(', ');

		fields.location.set(locationString);
	}

	// Show physical location input based on config and locationType
	const showPhysicalLocation = $derived.by(() => {
		const mode = config.fields.location.mode;
		if (mode === 'hidden') return false;
		if (mode === 'required' || mode === 'optional') return true;
		// conditional: show when onsite or hybrid
		if (mode === 'conditional') {
			return selectedLocationType === 'onsite' || selectedLocationType === 'hybrid';
		}
		return false;
	});

	// Physical location is required when mode is 'required' or when conditional and onsite/hybrid
	const isPhysicalLocationRequired = $derived.by(() => {
		const mode = config.fields.location.mode;
		if (mode === 'required') return true;
		if (mode === 'conditional') {
			return selectedLocationType === 'onsite' || selectedLocationType === 'hybrid';
		}
		return false;
	});

	// Show hiring location section when not hidden and locationType is remote or hybrid
	const showHiringLocation = $derived.by(() => {
		if (config.fields.hiringLocation.mode === 'hidden') return false;
		return selectedLocationType === 'remote' || selectedLocationType === 'hybrid';
	});

	// Description text based on location type
	const locationDescription = $derived.by(() => {
		if (selectedLocationType === 'onsite') {
			return 'Specify the city and country where employees will work';
		}
		if (selectedLocationType === 'hybrid') {
			return 'Specify the office location for in-person work days';
		}
		return 'Specify the physical location if applicable';
	});

	// Clear location field when switching to remote (if not conditional/required)
	$effect(() => {
		if (selectedLocationType === 'remote' && fields.location) {
			const mode = config.fields.location.mode;
			if (mode !== 'required' && mode !== 'conditional') {
				fields.location.set('');
				city = '';
				selectedCountries = [];
			}
		}
	});

	// Clear timezones when switching to worldwide
	$effect(() => {
		if (selectedHiringLocationType === 'worldwide' && selectedTimezones.length > 0) {
			selectedTimezones = [];
			if (fields.hiringLocation?.timezones) {
				fields.hiringLocation.timezones.set([]);
			}
		}
	});
</script>

<Field.Set>
	<Field.Legend>Location & Work Arrangement</Field.Legend>
	<Field.Description>Specify where and how the work will be performed</Field.Description>
	<Field.Separator />
	<Field.Group class="@container/field-group">
		<!-- Location Type -->
		{#if showLocationTypeChoice}
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
						{#each allowedLocationTypes as locType (locType.value)}
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
		{/if}

		<!-- Physical Location (Office Address) -->
		{#if showPhysicalLocation && fields.location}
			<Field.Field
				orientation="responsive"
				data-invalid={getFormFieldIssues(fields.location).length > 0}
				class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
			>
				<Field.Content>
					<Field.Label for="location-city">
						Office Location {isPhysicalLocationRequired ? '*' : ''}
					</Field.Label>
					<Field.Description>{locationDescription}</Field.Description>
				</Field.Content>
				<div class="flex flex-col gap-2">
					<!-- City + Country Structured Input -->
					<div class="flex flex-col gap-2 sm:flex-row">
						<Input
							id="location-city"
							placeholder="City (e.g., San Francisco)"
							value={city}
							oninput={(e) => {
								city = e.currentTarget.value;
								updateLocationField();
							}}
							class="flex-1"
							aria-label="City"
						/>
						<CountryPicker
							bind:value={selectedCountries}
							multiple={false}
							placeholder="Select country..."
							class="flex-1"
							onchange={updateLocationField}
						/>
					</div>

					<!-- Optional: Show combined value for confirmation -->
					{#if city || selectedCountries.length > 0}
						<p class="text-muted-foreground text-xs">
							Location: {[city, selectedCountries.length > 0 ? getCountryName(selectedCountries[0]) : '']
								.filter(Boolean)
								.join(', ') || 'Not specified'}
						</p>
					{/if}

					{#each getFormFieldIssues(fields.location) as issue, i (i)}
						<Field.Error>{issue.message}</Field.Error>
					{/each}
				</div>
			</Field.Field>
			{#if showHiringLocation}
				<Field.Separator />
			{/if}
		{/if}

		<!-- Hiring Location (Timezone Restrictions) -->
		{#if showHiringLocation && fields.hiringLocation}
			<Field.Field
				orientation="responsive"
				class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
			>
				<Field.Content>
					<Field.Label>Hiring Location *</Field.Label>
					<Field.Description>
						Specify geographic or timezone restrictions for remote work
					</Field.Description>
				</Field.Content>
				<div class="flex flex-col gap-2">
					<RadioGroup.Root
						value={selectedHiringLocationType}
						onValueChange={(v) => {
							if (v && fields.hiringLocation?.type) fields.hiringLocation.type.set(v as any);
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
							<Field.Label for="hiring-timezone" class="font-normal">
								Specific Timezones
							</Field.Label>
						</Field.Field>
					</RadioGroup.Root>
				</div>
			</Field.Field>

			{#if selectedHiringLocationType === 'timezone' && fields.hiringLocation.timezones}
				<Field.Separator />
				<Field.Field
					orientation="responsive"
					data-invalid={getFormFieldIssues(fields.hiringLocation.timezones).length > 0}
					class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
				>
					<Field.Content>
						<Field.Label>Allowed Timezones *</Field.Label>
						<Field.Description>
							Select one or more timezones where you're hiring. You can select regional groups or
							individual timezones.
						</Field.Description>
					</Field.Content>
					<div class="flex flex-col gap-2">
						<TimezonePicker
							bind:value={selectedTimezones}
							onchange={(timezones) => {
								updateTimezonesField(timezones);
							}}
							multiple={true}
							placeholder="Select timezones..."
						/>

						{#each getFormFieldIssues(fields.hiringLocation.timezones) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</div>
				</Field.Field>
			{/if}
		{/if}
	</Field.Group>
</Field.Set>
