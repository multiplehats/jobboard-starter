<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils/ui.js';
	import { getTimezoneOptions, getTimezoneLabel } from '$lib/utils/timezones.js';

	interface Props {
		value?: string[];
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		onchange?: (value: string[]) => void;
	}

	let {
		value = $bindable([]),
		placeholder = 'Select timezones...',
		class: className,
		disabled = false,
		onchange
	}: Props = $props();

	const timezones = getTimezoneOptions();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	// Derived label for the button
	const selectedLabel = $derived.by(() => {
		if (value.length === 0) {
			return placeholder;
		}
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
		if (value.includes(timezoneValue)) {
			value = value.filter((v) => v !== timezoneValue);
		} else {
			value = [...value, timezoneValue];
		}
		onchange?.(value);
	}

	function isSelected(timezoneValue: string): boolean {
		return value.includes(timezoneValue);
	}
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
		<Command.Root>
			<Command.Input placeholder="Search timezones..." autofocus />
			<Command.List>
				<Command.Empty>No timezone found.</Command.Empty>
				<Command.Group>
					{#each timezones as timezone (timezone.value)}
						<Command.Item
							value={timezone.searchText}
							onSelect={() => {
								toggleTimezone(timezone.value);
							}}
						>
							<CheckIcon class={cn('mr-2 size-4', !isSelected(timezone.value) && 'text-transparent')} />
							<div class="flex flex-col">
								<span class="text-sm">{timezone.value.replace(/_/g, ' ')}</span>
								<span class="text-muted-foreground text-xs">{timezone.offset}</span>
							</div>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
