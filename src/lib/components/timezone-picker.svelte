<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils/ui.js';
	import {
		getTimezoneOptions,
		getTimezoneLabel,
		getTimezoneGroups,
		type TimezoneGroup
	} from '$lib/utils/timezones.js';

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
		placeholder = 'Select timezones...',
		class: className,
		disabled = false,
		multiple = true,
		onchange
	}: Props = $props();

	const timezones = getTimezoneOptions();
	const { regional: regionalGroups, countrySpecific: countryGroups } = getTimezoneGroups();
	const MAX_RESULTS = 50; // Limit displayed results for performance

	let open = $state(false);
	let searchQuery = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);

	// Filter timezones based on search query
	const filteredTimezones = $derived.by(() => {
		if (!searchQuery.trim()) {
			// Show first MAX_RESULTS when no search query
			return timezones.slice(0, MAX_RESULTS);
		}

		const query = searchQuery.toLowerCase();
		const results: typeof timezones = [];

		// First pass: exact matches and selected items
		for (const tz of timezones) {
			if (value.includes(tz.value) || tz.searchText.includes(query)) {
				results.push(tz);
				if (results.length >= MAX_RESULTS) break;
			}
		}

		return results;
	});

	// Filter regional groups based on search query
	const filteredRegionalGroups = $derived.by(() => {
		if (!searchQuery.trim()) {
			return regionalGroups;
		}

		const query = searchQuery.toLowerCase();
		return regionalGroups.filter((group) => group.label.toLowerCase().includes(query));
	});

	// Filter country groups based on search query
	const filteredCountryGroups = $derived.by(() => {
		if (!searchQuery.trim()) {
			return countryGroups;
		}

		const query = searchQuery.toLowerCase();
		return countryGroups.filter((group) => group.label.toLowerCase().includes(query));
	});

	// Derived label for the button
	const selectedLabel = $derived.by(() => {
		if (value.length === 0) {
			return placeholder;
		}

		// Check regional groups first (prioritize larger groups)
		const fullySelectedRegionalGroups = regionalGroups.filter((group) => isGroupSelected(group));

		if (fullySelectedRegionalGroups.length > 0) {
			// Show the first selected regional group name
			if (fullySelectedRegionalGroups.length === 1) {
				return fullySelectedRegionalGroups[0].label;
			}
			// Multiple regional groups selected
			return `${fullySelectedRegionalGroups.length} regional groups selected`;
		}

		// Check country groups
		const fullySelectedCountryGroups = countryGroups.filter((group) => isGroupSelected(group));

		if (fullySelectedCountryGroups.length > 0) {
			// Show the first selected country group name
			if (fullySelectedCountryGroups.length === 1) {
				return fullySelectedCountryGroups[0].label;
			}
			// Multiple country groups selected
			return `${fullySelectedCountryGroups.length} country groups selected`;
		}

		// No complete groups selected, show individual timezone or count
		if (value.length === 1) {
			return getTimezoneLabel(value[0]);
		}
		return `${value.length} timezones selected`;
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

	function toggleTimezone(timezoneValue: string) {
		if (multiple) {
			if (value.includes(timezoneValue)) {
				value = value.filter((v) => v !== timezoneValue);
			} else {
				value = [...value, timezoneValue];
			}
		} else {
			// Single select mode
			value = [timezoneValue];
			closeAndFocusTrigger();
		}
		onchange?.(value);
	}

	function toggleGroup(group: TimezoneGroup) {
		if (!multiple) {
			// In single select mode, don't allow group selection
			return;
		}

		// Check if all timezones in the group are already selected
		const allSelected = group.timezones.every((tz) => value.includes(tz));

		if (allSelected) {
			// Deselect all timezones in the group
			value = value.filter((v) => !group.timezones.includes(v));
		} else {
			// Select all timezones in the group (add only those not already selected)
			const newTimezones = group.timezones.filter((tz) => !value.includes(tz));
			value = [...value, ...newTimezones];
		}

		onchange?.(value);
	}

	function isSelected(timezoneValue: string): boolean {
		return value.includes(timezoneValue);
	}

	function isGroupSelected(group: TimezoneGroup): boolean {
		return group.timezones.every((tz) => value.includes(tz));
	}

	function isGroupPartiallySelected(group: TimezoneGroup): boolean {
		const selectedCount = group.timezones.filter((tz) => value.includes(tz)).length;
		return selectedCount > 0 && selectedCount < group.timezones.length;
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
				<span class="truncate">{selectedLabel}</span>
				<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[400px] p-0" align="start">
		<Command.Root shouldFilter={false}>
			<Command.Input placeholder="Search timezones..." autofocus bind:value={searchQuery} />
			<Command.List>
				<Command.Empty>No timezone found.</Command.Empty>

				<!-- Regional Groups -->
				{#if multiple && filteredRegionalGroups.length > 0}
					<Command.Group heading="Regional Groups">
						{#each filteredRegionalGroups as group (group.id)}
							<Command.Item
								value={group.id}
								onSelect={() => {
									toggleGroup(group);
								}}
							>
								<CheckIcon
									class={cn(
										'mr-2 size-4',
										isGroupSelected(group)
											? ''
											: isGroupPartiallySelected(group)
												? 'opacity-50'
												: 'text-transparent'
									)}
								/>
								<span class="text-sm font-medium">{group.label}</span>
							</Command.Item>
						{/each}
					</Command.Group>
					<Command.Separator />
				{/if}

				<!-- Country-Specific Groups -->
				{#if multiple && filteredCountryGroups.length > 0}
					<Command.Group heading="Country Groups">
						{#each filteredCountryGroups as group (group.id)}
							<Command.Item
								value={group.id}
								onSelect={() => {
									toggleGroup(group);
								}}
							>
								<CheckIcon
									class={cn(
										'mr-2 size-4',
										isGroupSelected(group)
											? ''
											: isGroupPartiallySelected(group)
												? 'opacity-50'
												: 'text-transparent'
									)}
								/>
								<span class="text-sm font-medium">{group.label}</span>
							</Command.Item>
						{/each}
					</Command.Group>
					<Command.Separator />
				{/if}

				<!-- Individual Timezones -->
				<Command.Group heading="Individual Timezones">
					{#each filteredTimezones as timezone (timezone.value)}
						<Command.Item
							value={timezone.value}
							onSelect={() => {
								toggleTimezone(timezone.value);
							}}
						>
							<CheckIcon
								class={cn('mr-2 size-4', !isSelected(timezone.value) && 'text-transparent')}
							/>
							<div class="flex flex-col">
								<span class="text-sm">{timezone.value.replace(/_/g, ' ')}</span>
								<span class="text-muted-foreground text-xs">{timezone.offset}</span>
							</div>
						</Command.Item>
					{/each}
				</Command.Group>
				{#if filteredTimezones.length === MAX_RESULTS && searchQuery.trim()}
					<div class="text-muted-foreground px-2 py-1.5 text-center text-xs">
						Showing first {MAX_RESULTS} results. Keep typing to refine...
					</div>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
