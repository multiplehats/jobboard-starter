<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils/ui.js';
	import { getCountryOptions, getCountryName, getCountryFlagUrl } from '$lib/utils/countries.js';

	interface Props {
		value?: string[];
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		multiple?: boolean;
		onchange?: (value: string[]) => void;
	}

	let {
		value = $bindable([]),
		placeholder = 'Select countries...',
		class: className,
		disabled = false,
		multiple = true,
		onchange
	}: Props = $props();

	const countries = getCountryOptions();
	const MAX_RESULTS = 50; // Limit displayed results for performance

	let open = $state(false);
	let searchQuery = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);

	// Filter countries based on search query
	const filteredCountries = $derived.by(() => {
		if (!searchQuery.trim()) {
			// Show first MAX_RESULTS when no search query
			return countries.slice(0, MAX_RESULTS);
		}

		const query = searchQuery.toLowerCase();
		const results: typeof countries = [];

		// First pass: exact matches and selected items
		for (const country of countries) {
			if (value.includes(country.code) || country.searchText.includes(query)) {
				results.push(country);
				if (results.length >= MAX_RESULTS) break;
			}
		}

		return results;
	});

	// Derived label for the button
	const selectedLabel = $derived.by(() => {
		if (value.length === 0) {
			return placeholder;
		}
		if (value.length === 1) {
			return getCountryName(value[0]);
		}
		return `${value.length} countries selected`;
	});

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	function toggleCountry(countryCode: string) {
		if (multiple) {
			if (value.includes(countryCode)) {
				value = value.filter((v) => v !== countryCode);
			} else {
				value = [...value, countryCode];
			}
		} else {
			// Single select mode
			value = [countryCode];
			closeAndFocusTrigger();
		}
		onchange?.(value);
	}

	function isSelected(countryCode: string): boolean {
		return value.includes(countryCode);
	}

	// Reset search query when popover closes
	$effect(() => {
		if (!open) {
			searchQuery = '';
		}
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class={cn('w-full justify-between', className)}
				role="combobox"
				aria-expanded={open}
				{disabled}
			>
				<span class="flex items-center gap-2 truncate">
					{#if value.length === 1}
						<img
							src={getCountryFlagUrl(value[0])}
							alt={getCountryName(value[0])}
							class="size-4 rounded-full object-cover"
						/>
					{/if}
					<span class="truncate">{selectedLabel}</span>
				</span>
				<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[400px] p-0" align="start">
		<Command.Root shouldFilter={false}>
			<Command.Input placeholder="Search countries..." autofocus bind:value={searchQuery} />
			<Command.List>
				<Command.Empty>No country found.</Command.Empty>
				<Command.Group>
					{#each filteredCountries as country (country.code)}
						<Command.Item
							value={country.code}
							onSelect={() => {
								toggleCountry(country.code);
							}}
						>
							<CheckIcon
								class={cn('mr-2 size-4', !isSelected(country.code) && 'text-transparent')}
							/>
							<img
								src={country.flagUrl}
								alt={country.name}
								class="mr-2 size-5 rounded-full object-cover"
							/>
							<span class="text-sm">{country.name}</span>
						</Command.Item>
					{/each}
				</Command.Group>
				{#if filteredCountries.length === MAX_RESULTS && searchQuery.trim()}
					<div class="px-2 py-1.5 text-center text-xs text-muted-foreground">
						Showing first {MAX_RESULTS} results. Keep typing to refine...
					</div>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
