<script lang="ts">
	import { submitJobPosting } from '$lib/features/jobs/actions/post-job.remote.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Heading } from '$lib/components/ui/heading/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Section from '$lib/components/ui/section';
	import * as Intro from '$lib/components/ui/intro';
	import { EdraEditor, EdraDragHandleExtended } from '$lib/components/edra/shadcn';
	import JobDescriptionToolbar from '$lib/components/edra/shadcn/JobDescriptionToolbar.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Avatar from '$lib/components/ui/avatar';

	// Icons
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';

	import { getLocalTimeZone, today, parseDate, type CalendarDate } from '@internationalized/date';
	import type { Content, Editor } from '@tiptap/core';
	import {
		jobTypesList,
		seniorityLevelsList,
		locationTypesList,
		CURRENCIES,
		type JobType,
		type SeniorityLevel
	} from '$lib/features/jobs/constants';
	import PrefillFromUrlAction from '$lib/features/jobs/components/prefill-from-url-action.svelte';
	import type { PrefillResult } from '$lib/features/jobs/actions/prefill-from-url.remote';
	import { page } from '$app/state';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import { magicalTextReveal, magicalNumberReveal } from '$lib/utils/motion';
	import { tick } from 'svelte';
	import { PersistedState } from 'runed';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	// Get page data (includes pricing config)
	let { data }: { data: PageData } = $props();

	// Pricing configuration from server
	const pricing = data.pricing;
	const BASE_PRICE = pricing.basePriceUSD;
	const CURRENCY = pricing.currency;
	const ENABLED_UPSELLS = pricing.upsells.filter((u) => u.enabled);

	// Job type options (generated from constants)
	const jobTypes = jobTypesList();
	const seniorityLevels = seniorityLevelsList();
	const locationTypes = locationTypesList();
	const currencies = CURRENCIES;

	// Form state
	let selectedJobType = $state<JobType>();
	let selectedSeniority = $state<SeniorityLevel[]>([]);
	let selectedLocationType = $state('remote');
	let selectedHiringLocationType = $state('worldwide');
	let selectedWorkingPermitsType = $state('no-specific');
	let selectedCurrency = $state('USD');
	let salaryRange = $state([50000, 150000]);
	let applicationDeadline = $state<CalendarDate | undefined>();
	let deadlinePopoverOpen = $state(false);

	// Track selected upsells (map of upsell ID -> boolean)
	let selectedUpsells = $state<Set<string>>(new Set());

	// Editor state for job description
	let jobDescriptionEditor = $state<Editor>();
	let jobDescriptionContent = $state<Content>();
	let jobDescriptionJSON = $state('');

	const previewData = $derived.by(() => {
		const jobTypeLabel = jobTypes.find((t) => t.value === selectedJobType)?.label || 'Full Time';
		return {
			companyName: submitJobPosting.fields.organization.name.value() || 'Your Company Inc.',
			jobTitle: submitJobPosting.fields.job.title.value() || 'Job Title',
			salaryRange: [
				submitJobPosting.fields.salary.min.value() ?? 0,
				submitJobPosting.fields.salary.max.value() ?? 0
			],
			currency: submitJobPosting.fields.salary.currency.value() || 'USD',
			jobType: jobTypeLabel
		};
	});

	// Helpers for Select component display

	const currencyLabel = $derived(currencies.find((c) => c === selectedCurrency) ?? 'USD');
	const deadlineLabel = $derived(
		applicationDeadline
			? applicationDeadline.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
					month: 'long',
					day: 'numeric',
					year: 'numeric'
				})
			: 'Select deadline'
	);
	const deadlineValue = $derived(
		applicationDeadline ? applicationDeadline.toDate(getLocalTimeZone()).toISOString() : ''
	);

	// Prefill state
	let prefilledFields = $state<Set<string>>(new Set());
	let isPrefilling = $state(false);

	// Persisted state for draft saving
	type DraftData = {
		selectedJobType?: JobType;
		selectedSeniority: SeniorityLevel[];
		selectedLocationType: string;
		selectedHiringLocationType: string;
		selectedWorkingPermitsType: string;
		selectedCurrency: string;
		salaryRange: [number, number];
		applicationDeadline?: string;
		jobDescriptionJSON: string;
		selectedUpsells: string[];
		formValues: Record<string, unknown>;
	};

	const draftState = new PersistedState<DraftData>('job-posting-draft', {
		selectedJobType: undefined,
		selectedSeniority: [],
		selectedLocationType: 'remote',
		selectedHiringLocationType: 'worldwide',
		selectedWorkingPermitsType: 'no-specific',
		selectedCurrency: 'USD',
		salaryRange: [50000, 150000],
		applicationDeadline: undefined,
		jobDescriptionJSON: '',
		selectedUpsells: [],
		formValues: {}
	});

	let hasLoadedDraft = $state(false);
	let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

	// Handler for editor updates
	function onJobDescriptionUpdate() {
		if (jobDescriptionEditor && !jobDescriptionEditor.isDestroyed) {
			jobDescriptionContent = jobDescriptionEditor.getJSON();
			// Store JSON for database (allows editor restoration)
			jobDescriptionJSON = JSON.stringify(jobDescriptionContent);
		}
	}

	// Handler for prefill reset
	function handlePrefillReset() {
		// Clear all form fields that were prefilled
		prefilledFields.clear();
		prefilledFields = new Set(); // Trigger reactivity

		// Reset form state
		selectedJobType = undefined;
		selectedSeniority = [];
		selectedLocationType = 'remote';
		selectedHiringLocationType = 'worldwide';
		selectedWorkingPermitsType = 'no-specific';
		selectedCurrency = 'USD';
		salaryRange = [50000, 150000];
		applicationDeadline = undefined;

		// Clear editor content
		if (jobDescriptionEditor && !jobDescriptionEditor.isDestroyed) {
			jobDescriptionEditor.commands.clearContent();
			jobDescriptionJSON = '';
		}

		// Note: Remote forms don't have a reset method, so we manually clear fields
	}

	// Handler for prefill success
	async function handlePrefillSuccess(result: PrefillResult) {
		if (!result.success || !result.data) return;

		isPrefilling = true;
		const data = result.data;
		let animationDelay = 0;
		const delayIncrement = 150; // Stagger animations

		// Wait for next tick to ensure elements are rendered
		await tick();

		// Animate job title
		if (data.job?.title) {
			const titleInput = document.getElementById('job-title') as HTMLInputElement;
			if (titleInput) {
				magicalTextReveal(titleInput, data.job.title, {
					delay: animationDelay,
					charDelay: 20
				});
				prefilledFields.add('job.title');
				animationDelay += delayIncrement;
			}
		}

		// Set job type
		if (data.job?.type) {
			const jobType = data.job.type;
			setTimeout(() => {
				selectedJobType = jobType;
				prefilledFields.add('job.type');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set seniority levels
		if (data.job?.seniority && data.job.seniority.length > 0) {
			const seniority = data.job.seniority;
			setTimeout(() => {
				selectedSeniority = seniority;
				prefilledFields.add('job.seniority');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Animate job description (set editor content)
		if (data.job?.description && jobDescriptionEditor) {
			setTimeout(() => {
				if (jobDescriptionEditor && !jobDescriptionEditor.isDestroyed) {
					// Set as HTML or plain text
					jobDescriptionEditor.commands.setContent(data.job!.description!);
					onJobDescriptionUpdate();
					prefilledFields.add('job.description');
				}
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Animate application link/email
		if (data.job?.appLinkOrEmail) {
			const appInput = document.getElementById('job-application') as HTMLInputElement;
			if (appInput) {
				magicalTextReveal(appInput, data.job.appLinkOrEmail, {
					delay: animationDelay,
					charDelay: 15
				});
				prefilledFields.add('job.appLinkOrEmail');
				animationDelay += delayIncrement;
			}
		}

		// Set application deadline
		if (data.job?.applicationDeadline) {
			setTimeout(() => {
				try {
					applicationDeadline = parseDate(data.job!.applicationDeadline!);
					prefilledFields.add('job.applicationDeadline');
				} catch (e) {
					console.error('Failed to parse deadline:', e);
				}
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set location type
		if (data.locationType) {
			setTimeout(() => {
				selectedLocationType = data.locationType!;
				prefilledFields.add('locationType');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set hiring location
		if (data.hiringLocation?.type) {
			setTimeout(() => {
				selectedHiringLocationType = data.hiringLocation!.type!;
				prefilledFields.add('hiringLocation.type');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set working permits
		if (data.workingPermits?.type) {
			setTimeout(() => {
				selectedWorkingPermitsType = data.workingPermits!.type!;
				prefilledFields.add('workingPermits.type');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Animate salary range
		if (data.salary?.min !== undefined || data.salary?.max !== undefined) {
			setTimeout(() => {
				if (data.salary?.min !== undefined) {
					salaryRange[0] = data.salary.min;
					prefilledFields.add('salary.min');
				}
				if (data.salary?.max !== undefined) {
					salaryRange[1] = data.salary.max;
					prefilledFields.add('salary.max');
				}
				// Trigger reactivity
				salaryRange = [...salaryRange];
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Set currency
		if (data.salary?.currency) {
			setTimeout(() => {
				selectedCurrency = data.salary!.currency!;
				prefilledFields.add('salary.currency');
			}, animationDelay);
			animationDelay += delayIncrement;
		}

		// Animate company name
		if (data.organization?.name) {
			const companyInput = document.getElementById('company-name') as HTMLInputElement;
			if (companyInput) {
				magicalTextReveal(companyInput, data.organization.name, {
					delay: animationDelay,
					charDelay: 20
				});
				prefilledFields.add('organization.name');
				animationDelay += delayIncrement;
			}
		}

		// Animate company URL
		if (data.organization?.url) {
			const urlInput = document.getElementById('company-url') as HTMLInputElement;
			if (urlInput) {
				magicalTextReveal(urlInput, data.organization.url, {
					delay: animationDelay,
					charDelay: 15
				});
				prefilledFields.add('organization.url');
				animationDelay += delayIncrement;
			}
		}

		// Animate company logo
		if (data.organization?.logo) {
			const logoInput = document.getElementById('company-logo') as HTMLInputElement;
			if (logoInput) {
				magicalTextReveal(logoInput, data.organization.logo, {
					delay: animationDelay,
					charDelay: 15,
					onComplete: () => {
						isPrefilling = false;
					}
				});
				prefilledFields.add('organization.logo');
			}
		} else {
			// If no logo, end the prefilling state
			setTimeout(() => {
				isPrefilling = false;
			}, animationDelay);
		}
	}

	// Load draft on mount
	$effect(() => {
		if (!hasLoadedDraft && draftState.current) {
			const draft = draftState.current;

			// Restore state
			if (draft.selectedJobType) selectedJobType = draft.selectedJobType;
			if (draft.selectedSeniority) selectedSeniority = draft.selectedSeniority;
			if (draft.selectedLocationType) selectedLocationType = draft.selectedLocationType;
			if (draft.selectedHiringLocationType) selectedHiringLocationType = draft.selectedHiringLocationType;
			if (draft.selectedWorkingPermitsType) selectedWorkingPermitsType = draft.selectedWorkingPermitsType;
			if (draft.selectedCurrency) selectedCurrency = draft.selectedCurrency;
			if (draft.salaryRange) salaryRange = draft.salaryRange;
			if (draft.applicationDeadline) {
				try {
					applicationDeadline = parseDate(draft.applicationDeadline);
				} catch (e) {
					console.error('Failed to restore deadline:', e);
				}
			}
			if (draft.selectedUpsells) selectedUpsells = new Set(draft.selectedUpsells);

			// Restore form values (for text inputs)
			if (draft.formValues) {
				Object.entries(draft.formValues).forEach(([key, value]) => {
					// Use the remote function's field setter if available
					const field = (submitJobPosting as any).fields;
					if (field && typeof value === 'string') {
						// Navigate the nested structure
						const keys = key.split('.');
						let current = field;
						for (let i = 0; i < keys.length - 1; i++) {
							current = current[keys[i]];
						}
						const lastKey = keys[keys.length - 1];
						if (current[lastKey]?.value) {
							current[lastKey].value.set(value);
						}
					}
				});
			}

			// Restore editor content
			if (draft.jobDescriptionJSON && jobDescriptionEditor && !jobDescriptionEditor.isDestroyed) {
				try {
					jobDescriptionEditor.commands.setContent(JSON.parse(draft.jobDescriptionJSON));
					jobDescriptionJSON = draft.jobDescriptionJSON;
				} catch (e) {
					console.error('Failed to restore editor content:', e);
				}
			}

			hasLoadedDraft = true;
		}
	});

	// Auto-save function with debouncing
	function saveDraft() {
		// Clear any pending save
		if (autoSaveTimeout) {
			clearTimeout(autoSaveTimeout);
		}

		autoSaveTimeout = setTimeout(() => {
			// Collect all form field values
			const formValues: Record<string, unknown> = {};

			// Helper to collect field values recursively
			const collectFieldValues = (obj: any, prefix = ''): void => {
				if (!obj || typeof obj !== 'object') return;

				Object.entries(obj).forEach(([key, value]) => {
					const path = prefix ? `${prefix}.${key}` : key;

					if (value && typeof value === 'object' && 'value' in value) {
						// It's a field with a value property
						const fieldValue = (value as any).value?.();
						if (fieldValue !== undefined && fieldValue !== null) {
							formValues[path] = fieldValue;
						}
					} else if (value && typeof value === 'object') {
						// Recurse into nested objects
						collectFieldValues(value, path);
					}
				});
			};

			collectFieldValues((submitJobPosting as any).fields);

			draftState.current = {
				selectedJobType,
				selectedSeniority,
				selectedLocationType,
				selectedHiringLocationType,
				selectedWorkingPermitsType,
				selectedCurrency,
				salaryRange: [salaryRange[0], salaryRange[1]] as [number, number],
				applicationDeadline: applicationDeadline?.toString(),
				jobDescriptionJSON,
				selectedUpsells: Array.from(selectedUpsells),
				formValues
			};
		}, 500); // Debounce for 500ms
	}

	// Watch for changes and trigger auto-save
	$effect(() => {
		// Track all reactive dependencies
		selectedJobType;
		selectedSeniority;
		selectedLocationType;
		selectedHiringLocationType;
		selectedWorkingPermitsType;
		selectedCurrency;
		salaryRange;
		applicationDeadline;
		jobDescriptionJSON;
		selectedUpsells;

		// Don't save on initial load
		if (hasLoadedDraft) {
			saveDraft();
		}
	});

	// Handle Save Draft button click
	function handleSaveDraft() {
		// Force immediate save
		if (autoSaveTimeout) {
			clearTimeout(autoSaveTimeout);
		}

		// Collect all form field values
		const formValues: Record<string, unknown> = {};
		const collectFieldValues = (obj: any, prefix = ''): void => {
			if (!obj || typeof obj !== 'object') return;

			Object.entries(obj).forEach(([key, value]) => {
				const path = prefix ? `${prefix}.${key}` : key;

				if (value && typeof value === 'object' && 'value' in value) {
					const fieldValue = (value as any).value?.();
					if (fieldValue !== undefined && fieldValue !== null) {
						formValues[path] = fieldValue;
					}
				} else if (value && typeof value === 'object') {
					collectFieldValues(value, path);
				}
			});
		};

		collectFieldValues((submitJobPosting as any).fields);

		draftState.current = {
			selectedJobType,
			selectedSeniority,
			selectedLocationType,
			selectedHiringLocationType,
			selectedWorkingPermitsType,
			selectedCurrency,
			salaryRange: [salaryRange[0], salaryRange[1]] as [number, number],
			applicationDeadline: applicationDeadline?.toString(),
			jobDescriptionJSON,
			selectedUpsells: Array.from(selectedUpsells),
			formValues
		};

		toast.success('Draft saved successfully!', {
			description: 'Your progress has been saved and will be restored when you return.'
		});
	}

	// Calculate total price based on selected upsells
	const totalPrice = $derived.by(() => {
		let total = BASE_PRICE;
		ENABLED_UPSELLS.forEach((upsell) => {
			if (selectedUpsells.has(upsell.id)) {
				total += upsell.priceUSD;
			}
		});
		return total;
	});
</script>

<Intro.Root>
	<Intro.Title>Post a Job</Intro.Title>
	<Intro.Description>
		Your job post will be pinned to the top and highlighted in relevant search results for {pricing.defaultDuration} days.
	</Intro.Description>
</Intro.Root>

<Section.Root>
	<Section.Content animate={true} animateDelay={0.45}>
		{#if page.data.config.flags.prefillJobFromURL}
			<PrefillFromUrlAction
				title="Prefill from ATS or Job URL"
				description="Save time by pasting a job URL. We automatically extract job details for you."
				onSuccess={handlePrefillSuccess}
				onReset={handlePrefillReset}
			/>
		{/if}

		<form {...submitJobPosting} class="w-full">
			<Field.Group>
				<Field.Set>
					<Field.Legend>Job Information</Field.Legend>
					<Field.Description>Basic details about the position</Field.Description>
					<Field.Separator />
					<Field.Group class="@container/field-group">
						<!-- Job Title -->
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.job.title).length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label for="job-title">Job Title *</Field.Label>
								<Field.Description>Maximum 80 characters</Field.Description>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Input
									id="job-title"
									placeholder="e.g. Senior Software Engineer"
									{...submitJobPosting.fields.job.title.as('text')}
									aria-invalid={getFormFieldIssues(submitJobPosting.fields.job.title).length > 0}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.job.title) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
						<Field.Separator />

						<!-- Job Type -->
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.job.type).length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label for="job-type">Job Type *</Field.Label>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Select.Root type="single" bind:value={selectedJobType}>
									<Select.Trigger id="job-type">
										{#if selectedJobType}
											{jobTypes.find((t) => t.value === selectedJobType)?.label ?? selectedJobType}
										{:else}
											Select job type
										{/if}
									</Select.Trigger>
									<Select.Content>
										{#each jobTypes as type (type.value)}
											<Select.Item value={type.value}>{type.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<input
									{...submitJobPosting.fields.job.type.as('text')}
									type="hidden"
									value={selectedJobType}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.job.type) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
						<Field.Separator />

						<!-- Seniority Levels -->
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.job.seniority).length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label>Seniority Level(s) *</Field.Label>
								<Field.Description>Select all that apply</Field.Description>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Field.Group class="gap-3">
									{#each seniorityLevels as level (level.value)}
										<Field.Field orientation="horizontal">
											<Checkbox
												id="seniority-{level.value}"
												checked={selectedSeniority.includes(level.value)}
												onchange={(e) => {
													const target = e.currentTarget as HTMLInputElement;
													if (target.checked) {
														selectedSeniority = [...selectedSeniority, level.value];
													} else {
														selectedSeniority = selectedSeniority.filter((s) => s !== level.value);
													}
												}}
											/>
											<Field.Label for="seniority-{level.value}" class="font-normal">
												{level.label}
											</Field.Label>
										</Field.Field>
									{/each}
								</Field.Group>
								<input
									{...submitJobPosting.fields.job.seniority.as('select multiple')}
									type="hidden"
									value={JSON.stringify(selectedSeniority)}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.job.seniority) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
						<Field.Separator />

						<!-- Job Description -->
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.job.description).length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label for="job-description">Job Description *</Field.Label>
								<Field.Description>Provide a detailed description of the position</Field.Description>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<div
									id="job-description"
									class="rounded-md border border-input bg-background"
									aria-invalid={getFormFieldIssues(submitJobPosting.fields.job.description).length > 0}
								>
									{#if jobDescriptionEditor && !jobDescriptionEditor.isDestroyed}
										<JobDescriptionToolbar
											class="w-full overflow-x-auto border-b bg-secondary/50 p-1"
											editor={jobDescriptionEditor}
										/>
										<EdraDragHandleExtended editor={jobDescriptionEditor} />
									{/if}
									<EdraEditor
										bind:editor={jobDescriptionEditor}
										content={jobDescriptionContent}
										class="max-h-[400px] min-h-[200px] overflow-y-auto px-6 pr-2"
										onUpdate={onJobDescriptionUpdate}
									/>
								</div>
								<input
									{...submitJobPosting.fields.job.description.as('text')}
									type="hidden"
									value={jobDescriptionJSON}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.job.description) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
						<Field.Separator />

						<!-- Application Method -->
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.job.appLinkOrEmail).length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label for="job-application">Application Link or Email *</Field.Label>
								<Field.Description
									>Enter a URL or email address where candidates can apply</Field.Description
								>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Input
									id="job-application"
									placeholder="https://careers.company.com/apply or jobs@company.com"
									{...submitJobPosting.fields.job.appLinkOrEmail.as('text')}
									aria-invalid={getFormFieldIssues(submitJobPosting.fields.job.appLinkOrEmail).length >
										0}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.job.appLinkOrEmail) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
						<Field.Separator />

						<!-- Application Deadline -->
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.job.applicationDeadline)
								.length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label for="job-deadline">Application Deadline *</Field.Label>
								<Field.Description>Select the last day candidates can apply</Field.Description>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Popover.Root bind:open={deadlinePopoverOpen}>
									<Popover.Trigger id="job-deadline">
										{#snippet child({ props })}
											<Button
												{...props}
												variant="outline"
												class="w-full justify-start font-normal"
												aria-invalid={getFormFieldIssues(
													submitJobPosting.fields.job.applicationDeadline
												).length > 0}
											>
												<CalendarIcon class="mr-2 size-4" />
												{deadlineLabel}
											</Button>
										{/snippet}
									</Popover.Trigger>
									<Popover.Content class="w-auto overflow-hidden p-0" align="start">
										<Calendar
											type="single"
											bind:value={applicationDeadline}
											captionLayout="dropdown"
											onValueChange={() => {
												deadlinePopoverOpen = false;
											}}
											minValue={today(getLocalTimeZone())}
										/>
									</Popover.Content>
								</Popover.Root>
								<input
									{...submitJobPosting.fields.job.applicationDeadline.as('text')}
									type="hidden"
									value={deadlineValue}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.job.applicationDeadline) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
					</Field.Group>
				</Field.Set>
				<Field.Separator />
				<Field.Set>
					<Field.Legend>Location & Work Arrangement</Field.Legend>
					<Field.Description>Specify where and how the work will be performed</Field.Description>
					<Field.Separator />
					<Field.Group class="@container/field-group">
						<!-- Location Type -->
						<Field.Field orientation="responsive" class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]">
							<Field.Content>
								<Field.Label for="location-type">Location Type *</Field.Label>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<RadioGroup.Root bind:value={selectedLocationType}>
									{#each locationTypes as locType (locType.value)}
										<Field.Field orientation="horizontal">
											<RadioGroup.Item value={locType.value} id="location-{locType.value}" />
											<Field.Label for="location-{locType.value}" class="font-normal">
												{locType.label}
											</Field.Label>
										</Field.Field>
									{/each}
								</RadioGroup.Root>
								<input
									{...submitJobPosting.fields.locationType.as('text')}
									type="hidden"
									value={selectedLocationType}
								/>
							</div>
						</Field.Field>
						<Field.Separator />

						<!-- Hiring Location Type -->
						<Field.Field orientation="responsive" class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]">
							<Field.Content>
								<Field.Label>Hiring Location *</Field.Label>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<RadioGroup.Root bind:value={selectedHiringLocationType}>
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
								<input
									{...submitJobPosting.fields.hiringLocation.type.as('text')}
									type="hidden"
									value={selectedHiringLocationType}
								/>
							</div>
						</Field.Field>

						{#if selectedHiringLocationType === 'timezone'}
							<Field.Separator />
							<Field.Field orientation="responsive" class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]">
								<Field.Content>
									<Field.Label for="timezones">Allowed Timezones</Field.Label>
									<Field.Description>Enter timezone identifiers separated by commas</Field.Description>
								</Field.Content>
								<div class="flex flex-col gap-2">
									<Input
										id="timezones"
										placeholder="e.g., America/New_York, Europe/London (comma separated)"
										{...submitJobPosting.fields.hiringLocation.timezones.as('select multiple')}
									/>
								</div>
							</Field.Field>
						{/if}
					</Field.Group>
				</Field.Set>
				<Field.Separator />
				<Field.Set>
					<Field.Legend>Working Permits</Field.Legend>
					<Field.Description>Specify any visa or work permit requirements</Field.Description>
					<Field.Separator />
					<Field.Group class="@container/field-group">
						<Field.Field orientation="responsive" class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]">
							<Field.Content>
								<Field.Label>Working Permits Type *</Field.Label>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<RadioGroup.Root bind:value={selectedWorkingPermitsType}>
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
								<input
									{...submitJobPosting.fields.workingPermits.type.as('text')}
									type="hidden"
									value={selectedWorkingPermitsType}
								/>
							</div>
						</Field.Field>

						{#if selectedWorkingPermitsType === 'required'}
							<Field.Separator />
							<Field.Field orientation="responsive" class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]">
								<Field.Content>
									<Field.Label for="required-permits">Required Permits</Field.Label>
									<Field.Description>Enter required permits separated by commas</Field.Description>
								</Field.Content>
								<div class="flex flex-col gap-2">
									<Input
										id="required-permits"
										placeholder="e.g., US Work Authorization, EU Work Permit (comma separated)"
										{...submitJobPosting.fields.workingPermits.permits.as('select multiple')}
									/>
								</div>
							</Field.Field>
						{/if}
					</Field.Group>
				</Field.Set>
				<Field.Separator />
				<Field.Set>
					<Field.Legend>Salary Range</Field.Legend>
					<Field.Description>Optionally specify the annual salary range for this position</Field.Description>
					<Field.Separator />
					<Field.Group class="@container/field-group">
						<Field.Field orientation="responsive" class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]">
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
									bind:value={salaryRange}
									max={500000}
									min={0}
									step={5000}
									class="w-full"
									aria-label="Salary Range"
								/>
								<input
									{...submitJobPosting.fields.salary.min.as('number')}
									type="hidden"
									value={salaryRange[0]}
								/>
								<input
									{...submitJobPosting.fields.salary.max.as('number')}
									type="hidden"
									value={salaryRange[1]}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.salary.min) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
								{#each getFormFieldIssues(submitJobPosting.fields.salary.max) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive" class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]">
							<Field.Content>
								<Field.Label for="salary-currency">Currency</Field.Label>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Select.Root type="single" bind:value={selectedCurrency}>
									<Select.Trigger id="salary-currency">
										{currencyLabel}
									</Select.Trigger>
									<Select.Content>
										{#each currencies as currency (currency)}
											<Select.Item value={currency}>{currency}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<input
									{...submitJobPosting.fields.salary.currency.as('text')}
									type="hidden"
									value={selectedCurrency}
								/>
							</div>
						</Field.Field>
					</Field.Group>
				</Field.Set>
				<Field.Separator />
				<Field.Set>
					<Field.Legend>Company Information</Field.Legend>
					<Field.Description>Details about your organization</Field.Description>
					<Field.Separator />
					<Field.Group class="@container/field-group">
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.organization.name).length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label for="company-name">Company Name *</Field.Label>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Input
									id="company-name"
									placeholder="Your Company Inc."
									{...submitJobPosting.fields.organization.name.as('text')}
									aria-invalid={getFormFieldIssues(submitJobPosting.fields.organization.name).length >
										0}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.organization.name) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
						<Field.Separator />
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.organization.url).length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label for="company-url">Company Website *</Field.Label>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Input
									id="company-url"
									placeholder="https://yourcompany.com"
									{...submitJobPosting.fields.organization.url.as('text')}
									type="url"
									aria-invalid={getFormFieldIssues(submitJobPosting.fields.organization.url).length > 0}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.organization.url) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive" class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]">
							<Field.Content>
								<Field.Label for="company-logo">Company Logo URL</Field.Label>
								<Field.Description>Optional: URL to your company logo</Field.Description>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Input
									id="company-logo"
									placeholder="https://yourcompany.com/logo.png"
									{...submitJobPosting.fields.organization.logo.as('text')}
									type="url"
								/>
							</div>
						</Field.Field>
						<Field.Separator />
						<Field.Field
							orientation="responsive"
							data-invalid={getFormFieldIssues(submitJobPosting.fields.customerEmail).length > 0}
							class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
						>
							<Field.Content>
								<Field.Label for="customer-email">Your Email *</Field.Label>
								<Field.Description
									>We'll send payment confirmation and job posting updates here</Field.Description
								>
							</Field.Content>
							<div class="flex flex-col gap-2">
								<Input
									id="customer-email"
									placeholder="you@company.com"
									{...submitJobPosting.fields.customerEmail.as('text')}
									type="email"
									aria-invalid={getFormFieldIssues(submitJobPosting.fields.customerEmail).length > 0}
								/>
								{#each getFormFieldIssues(submitJobPosting.fields.customerEmail) as issue, i (i)}
									<Field.Error>{issue.message}</Field.Error>
								{/each}
							</div>
						</Field.Field>
					</Field.Group>
				</Field.Set>
				<Field.Separator />
				{#if ENABLED_UPSELLS.length > 0}
					<Field.Set>
						<Field.Legend>Upgrades</Field.Legend>
						<Field.Description>Enhance your job posting visibility</Field.Description>
						<Field.Separator />
						<Field.Group class="@container/field-group gap-4">
							{#each ENABLED_UPSELLS as upsell (upsell.id)}
								<div
									class="rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
								>
									<Field.Field orientation="horizontal" class="items-start gap-3">
										<Checkbox
											id="upsell-{upsell.id}"
											checked={selectedUpsells.has(upsell.id)}
											onchange={(e) => {
												const target = e.currentTarget as HTMLInputElement;
											const checked = target.checked;
												if (checked) {
													selectedUpsells.add(upsell.id);
												} else {
													selectedUpsells.delete(upsell.id);
												}
												selectedUpsells = new Set(selectedUpsells);
											}}
											class="mt-1"
										/>
										<Field.Content class="space-y-1">
											<Field.Label
												for="upsell-{upsell.id}"
												class="text-base leading-none font-semibold"
											>
												{upsell.name}
												<Badge variant="secondary" class="ml-2">+${upsell.priceUSD}</Badge>
												{#if upsell.badge}
													<Badge variant="outline" class="ml-1">{upsell.badge}</Badge>
												{/if}
											</Field.Label>
											<Field.Description class="text-sm">
												{upsell.description}
											</Field.Description>
										</Field.Content>
									</Field.Field>
								</div>
							{/each}
						</Field.Group>
						<!-- Hidden field to submit selected upsells as array -->
						<input
							{...submitJobPosting.fields.selectedUpsells.as('select multiple')}
							type="hidden"
							value={Array.from(selectedUpsells)}
						/>
					</Field.Set>
				{/if}
				<Field.Separator />
				<Field.Field orientation="horizontal">
					<Button type="button" variant="outline" size="lg" onclick={handleSaveDraft}>Save as Draft</Button>
					<Button type="submit" size="lg" class="bg-gradient-to-r from-primary to-primary/80">
						<CheckCircleIcon class="mr-2 size-5" />
						Publish Job Posting
					</Button>
				</Field.Field>
			</Field.Group>
		</form>
	</Section.Content>

	<Section.Sidebar animate={true} animateDelay={0.5}>
		<div class="relative flex h-full w-full flex-col bg-muted/40 p-5 pt-8 xl:p-6">
			<div class="flex flex-col items-center">
				<Heading as="h3" size="h4" class="mb-5">Order summary</Heading>
			</div>

			<div class="flex flex-col gap-y-5">
				<Item.Root variant="outline">
					<Item.Header>
						<Item.Title>Total</Item.Title>
						<Item.Description class="text-pretty">${totalPrice} {CURRENCY}</Item.Description>
					</Item.Header>
					<Item.Footer class="block text-xs">
						Job post will be <span class="font-medium">pinned</span> for {pricing.defaultDuration} days.
					</Item.Footer>
				</Item.Root>

				<Item.Root class="border-primary bg-background">
					<Item.Content class="flex flex-col flex-wrap justify-between">
						<Item.Media class="justify-start">
							<Avatar.Root class="size-10">
								<Avatar.Image
									src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60"
									alt="Company Logo"
								/>
								<Avatar.Fallback>CI</Avatar.Fallback>
							</Avatar.Root>
						</Item.Media>

						<Item.Header class="flex-col items-start">
							<Item.Title class="text-lg md:text-xl">
								{previewData.jobTitle}
							</Item.Title>
						</Item.Header>

						<div class="">
							<p class="mb-2 font-medium text-gray-700">
								{previewData.companyName}
							</p>
						</div>
						<div class="mb-6 flex h-6 flex-wrap gap-4 overflow-y-hidden">
							<p class="inline-flex items-center text-gray-600">
								{previewData.salaryRange[0]} - {previewData.salaryRange[1]}
								{previewData.currency}
							</p>
						</div>
					</Item.Content>
					<Item.Footer class="flex">
						<Badge variant="secondary">
							{previewData.jobType}
						</Badge>
					</Item.Footer>
				</Item.Root>

				<Button type="button">Post job for ${totalPrice} {CURRENCY}</Button>
				<div class="w-full border-t border-gray-100"></div>
				<div class="flex flex-col gap-y-5">
					<div>
						<div class="mb-1 flex flex-row items-center gap-x-2">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								class="text-primary-700 h-5 w-5"
								><path
									d="M1 10h22M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								></path></svg
							>
							<p class="text-base font-medium text-gray-700">Secure checkout powered by Stripe</p>
						</div>
						<p class="text-sm text-gray-600">
							The same payment processor trusted by millions of companies including Amazon, Google,
							and Shopify.
						</p>
					</div>
					<div class="hidden [@media(min-height:760px)]:block">
						<div class="mb-1 flex flex-row items-center gap-x-2">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								class="text-primary-700 h-5 w-5"
								><path
									d="M12.0004 15L12.0004 22M8.00043 7.30813V9.43875C8.00043 9.64677 8.00043 9.75078 7.98001 9.85026C7.9619 9.93852 7.93194 10.0239 7.89095 10.1042C7.84474 10.1946 7.77977 10.2758 7.64982 10.4383L6.08004 12.4005C5.4143 13.2327 5.08143 13.6487 5.08106 13.9989C5.08073 14.3035 5.21919 14.5916 5.4572 14.7815C5.73088 15 6.26373 15 7.32943 15H16.6714C17.7371 15 18.27 15 18.5437 14.7815C18.7817 14.5916 18.9201 14.3035 18.9198 13.9989C18.9194 13.6487 18.5866 13.2327 17.9208 12.4005L16.351 10.4383C16.2211 10.2758 16.1561 10.1946 16.1099 10.1042C16.0689 10.0239 16.039 9.93852 16.0208 9.85026C16.0004 9.75078 16.0004 9.64677 16.0004 9.43875V7.30813C16.0004 7.19301 16.0004 7.13544 16.0069 7.07868C16.0127 7.02825 16.0223 6.97833 16.0357 6.92937C16.0507 6.87424 16.0721 6.8208 16.1149 6.71391L17.1227 4.19423C17.4168 3.45914 17.5638 3.09159 17.5025 2.79655C17.4489 2.53853 17.2956 2.31211 17.0759 2.1665C16.8247 2 16.4289 2 15.6372 2H8.36368C7.57197 2 7.17611 2 6.92494 2.1665C6.70529 2.31211 6.55199 2.53853 6.49838 2.79655C6.43707 3.09159 6.58408 3.45914 6.87812 4.19423L7.88599 6.71391C7.92875 6.8208 7.95013 6.87424 7.96517 6.92937C7.97853 6.97833 7.98814 7.02825 7.99392 7.07868C8.00043 7.13544 8.00043 7.19301 8.00043 7.30813Z"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								></path></svg
							>
							<p class="text-base font-medium text-gray-700">Pinned to the top of search results</p>
						</div>
						<p class="text-sm text-gray-600">
							Pinned jobs appear at the top of our main page and relevant searches, resulting in 20x
							the number of clicks.
						</p>
					</div>
					<div class="hidden [@media(min-height:800px)]:block">
						<div class="mb-1 flex flex-row items-center gap-x-2">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								class="text-primary-700 h-5 w-5"
								><path
									d="M4.5 22v-5m0-10V2M2 4.5h5m-5 15h5M13 3l-1.734 4.509c-.282.733-.423 1.1-.643 1.408a3 3 0 01-.706.707c-.308.219-.675.36-1.408.642L4 12l4.509 1.734c.733.282 1.1.423 1.408.643.273.194.512.433.707.706.219.308.36.675.642 1.408L13 21l1.734-4.509c.282-.733.423-1.1.643-1.408.194-.273.433-.512.706-.707.308-.219.675-.36 1.408-.642L22 12l-4.509-1.734c-.733-.282-1.1-.423-1.408-.642a3 3 0 01-.706-.707c-.22-.308-.36-.675-.643-1.408L13 3z"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								></path></svg
							>
							<p class="text-base font-medium text-gray-700">
								Highlighted border to attract attention
							</p>
						</div>
						<p class="text-sm text-gray-600">
							Paid jobs are highlighted in purple to maximise the number of people who see your job.
						</p>
					</div>
				</div>
			</div>
		</div>
	</Section.Sidebar>
</Section.Root>
