<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/arrow-right';
	import XIcon from '@lucide/svelte/icons/x';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils/ui';
	import {
		submitPrefillJobFromURL,
		type PrefillResult
	} from '$lib/features/jobs/actions/prefill-from-url.remote';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import { FormErrors } from '$lib/components/ui/form';

	type Props = {
		title: string;
		description: string;
		onHide?: () => void;
		onSuccess?: (result: PrefillResult) => void;
		onReset?: () => void;
	};

	let { onHide, title, description, onSuccess, onReset }: Props = $props();

	const value = $derived(submitPrefillJobFromURL.fields.url.value());
	const fieldIssues = $derived(getFormFieldIssues(submitPrefillJobFromURL.fields.url));
	const isSubmitting = $derived(submitPrefillJobFromURL.pending);
	const formResult = $derived(submitPrefillJobFromURL.result);

	let isCollapsed = $state(false);
	let showCelebration = $state(false);

	// Watch for successful submission
	$effect(() => {
		if (formResult?.success && formResult.data && onSuccess) {
			// Trigger celebration effect
			showCelebration = true;
			setTimeout(() => {
				showCelebration = false;
			}, 800);

			// Collapse after a short delay
			setTimeout(() => {
				isCollapsed = true;
			}, 500);

			onSuccess(formResult as PrefillResult);
		}
	});

	// Extract company name from URL or data
	const companyName = $derived.by(() => {
		if (formResult?.success && formResult.data?.organization?.name) {
			return formResult.data.organization.name;
		}
		if (value) {
			try {
				const url = new URL(value);
				const hostname = url.hostname.replace('www.', '');
				const domain = hostname.split('.')[0];
				return domain.charAt(0).toUpperCase() + domain.slice(1);
			} catch {
				return null;
			}
		}
		return null;
	});

	function handleReset() {
		isCollapsed = false;
		submitPrefillJobFromURL.reset();
		if (onReset) {
			onReset();
		}
	}
</script>

<div
	class={cn(
		'relative overflow-hidden transition-all duration-500 ease-in-out',
		isCollapsed ? 'max-h-16' : 'max-h-[800px]'
	)}
>
	<!-- Celebration particles (CSS only) -->
	{#if showCelebration}
		<div class="celebration-particles pointer-events-none absolute inset-0 z-10">
			{#each Array(12) as _, i}
				<div
					class="particle"
					style="left: {Math.random() * 100}%; animation-delay: {i * 50}ms; --rotation: {Math.random() * 360}deg"
				></div>
			{/each}
		</div>
	{/if}

	{#if isCollapsed && formResult?.success}
		<!-- Collapsed Success Banner -->
		<div
			class="flex items-center justify-between rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-4 py-3 shadow-sm transition-all duration-300 hover:border-primary/50"
		>
			<div class="flex items-center gap-2">
				<SparklesIcon class="size-4 text-primary animate-pulse" />
				<p class="text-sm font-medium">
					Prefilled {formResult.filledFields?.length || 0} field{formResult.filledFields?.length !==
					1
						? 's'
						: ''}
					{#if companyName}
						<span class="text-muted-foreground">from {companyName}</span>
					{/if}
				</p>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
				onclick={handleReset}
			>
				Reset
			</Button>
		</div>
	{:else}
		<!-- Full Component -->
		<Item.Root variant="outline" class="relative">
			{#snippet child({ props })}
				<form {...props} {...submitPrefillJobFromURL}>
					{#if onHide}
						<Button
							size="icon"
							variant="ghost"
							aria-label="Close"
							class="absolute top-2 right-2"
							onclick={onHide}
						>
							<XIcon />
						</Button>
					{/if}

					<Item.Content class="relative">
						<Item.Title class="flex items-center gap-2">
							<SparklesIcon class="size-5 text-primary" />
							{title}
						</Item.Title>
						<Item.Description>{description}</Item.Description>

						<!-- Show validation errors -->
						{#if fieldIssues.length > 0}
							<FormErrors
								class="mt-2"
								issues={fieldIssues}
								title="Invalid URL"
								description="Please enter a valid job posting URL"
							/>
						{/if}

						<!-- Show extraction error -->
						{#if formResult && !formResult.success && formResult.error}
							<div
								class="mt-2 flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3"
							>
								<AlertCircleIcon class="mt-0.5 size-4 shrink-0 text-destructive" />
								<div class="flex-1 text-sm">
									<p class="font-medium text-destructive">Extraction Failed</p>
									<p class="text-muted-foreground">{formResult.error}</p>
								</div>
							</div>
						{/if}
					</Item.Content>

					<Item.Footer>
						<InputGroup.Root>
							<InputGroup.Input
								id="url"
								placeholder="https://jobs.company.com/opening/senior-engineer"
								{...submitPrefillJobFromURL.fields.url.as('url')}
								aria-invalid={getFormFieldIssues(submitPrefillJobFromURL.fields.url).length > 0}
								disabled={isSubmitting}
							/>

							<InputGroup.Addon align="inline-end">
								<InputGroup.Button
									aria-label="Extract job data"
									variant="default"
									size="xs"
									type="submit"
									disabled={isSubmitting}
									class={cn(
										'invisible rounded-full',
										value && value?.length > 3 ? 'visible cursor-pointer' : ''
									)}
								>
									{#if isSubmitting}
										<SparklesIcon class="animate-pulse" />
										Extracting...
									{:else}
										Extract
										<ChevronRightIcon />
									{/if}
								</InputGroup.Button>
							</InputGroup.Addon>
						</InputGroup.Root>
					</Item.Footer>
				</form>
			{/snippet}
		</Item.Root>
	{/if}
</div>

<style>
	.celebration-particles {
		pointer-events: none;
	}

	.particle {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		animation: particle-float 0.8s ease-out forwards;
		background: linear-gradient(45deg, hsl(var(--primary)), hsl(var(--primary) / 0.5));
		opacity: 0;
	}

	@keyframes particle-float {
		0% {
			transform: translateY(50%) scale(0) rotate(0deg);
			opacity: 1;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: translateY(-100px) scale(1) rotate(var(--rotation));
			opacity: 0;
		}
	}

	/* Add subtle shimmer to collapsed banner */
	.bg-gradient-to-r:hover::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			hsl(var(--primary) / 0.1),
			transparent
		);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			left: -100%;
		}
		100% {
			left: 100%;
		}
	}
</style>
