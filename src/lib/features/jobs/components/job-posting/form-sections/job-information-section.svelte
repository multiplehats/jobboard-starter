<script lang="ts">
	/**
	 * Job Information Section - Simplified to work directly with form fields
	 * No intermediate state - reads with .value(), writes with .set()
	 */
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { EdraEditor, EdraDragHandleExtended } from '$lib/components/edra/shadcn';
	import JobDescriptionToolbar from '$lib/components/edra/shadcn/job-description-toolbar.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { getLocalTimeZone, today, parseDate } from '@internationalized/date';
	import { jobTypesList, seniorityLevelsList } from '$lib/features/jobs/constants';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import type { PublicJobPostingFields } from '../types';
	import type { Editor, Content } from '@tiptap/core';

	let { fields, disableFields }: { fields: PublicJobPostingFields } = $props();

	// Job type options
	const jobTypes = jobTypesList();
	const seniorityLevels = seniorityLevelsList();

	// Only pure UI state (NOT form data!)
	let deadlinePopoverOpen = $state(false);
	let jobDescriptionEditor = $state<Editor>();
	let jobDescriptionContent = $state<Content>();

	// Helper for deadline display
	const deadlineLabel = $derived.by(() => {
		const value = fields.job.applicationDeadline.value();
		if (!value) return 'Select deadline';
		try {
			const date = parseDate(value);
			return date.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return 'Select deadline';
		}
	});

	// Handler for editor updates - converts editor content to JSON string for form
	function onJobDescriptionUpdate() {
		if (jobDescriptionEditor && !jobDescriptionEditor.isDestroyed) {
			jobDescriptionContent = jobDescriptionEditor.getJSON();
			fields.job.description.set(JSON.stringify(jobDescriptionContent));
		}
	}

	// Reactive: Get current selected job type from form
	const selectedJobType = $derived(fields.job.type.value());

	// Reactive: Get current selected seniority levels from form
	const selectedSeniority = $derived(fields.job.seniority.value() || []);
</script>

<Field.Set>
	<Field.Legend>Job Information</Field.Legend>
	<Field.Description>Basic details about the position</Field.Description>
	<Field.Separator />
	<Field.Group class="@container/field-group">
		<!-- Job Title - Native input, use .as() spread -->
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.job.title).length > 0}
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label for="job-title">Job Title *</Field.Label>
				<Field.Description>Maximum 80 characters</Field.Description>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<!-- Direct spread - no binding needed! -->
				<Input
					id="job-title"
					placeholder="e.g. Senior Software Engineer"
					{...fields.job.title.as('text')}
					aria-invalid={getFormFieldIssues(fields.job.title).length > 0}
					disabled={disableFields}
				/>
				{#each getFormFieldIssues(fields.job.title) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
		<Field.Separator />

		<!-- Job Type - Custom Select component, use value + onValueChange -->
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.job.type).length > 0}
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label for="job-type">Job Type *</Field.Label>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<!-- No bind:! Just value + onValueChange -->
				<Select.Root
					type="single"
					value={selectedJobType}
					disabled={disableFields}
					onValueChange={(v) => {
						if (v) fields.job.type.set(v as any);
					}}
				>
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
				{#each getFormFieldIssues(fields.job.type) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
		<Field.Separator />

		<!-- Seniority Levels - Checkboxes, direct onChange handlers -->
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.job.seniority).length > 0}
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
								disabled={disableFields}
								onchange={(e) => {
									const target = e.currentTarget as HTMLInputElement;
									let newSeniority = [...selectedSeniority];
									if (target.checked) {
										newSeniority.push(level.value);
									} else {
										newSeniority = newSeniority.filter((s) => s !== level.value);
									}
									// Update form field directly with the array
									fields.job.seniority.set(newSeniority);
								}}
							/>
							<Field.Label for="seniority-{level.value}" class="font-normal">
								{level.label}
							</Field.Label>
						</Field.Field>
					{/each}
				</Field.Group>
				{#each getFormFieldIssues(fields.job.seniority) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
		<Field.Separator />

		<!-- Job Description -->
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.job.description).length > 0}
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
					aria-invalid={getFormFieldIssues(fields.job.description).length > 0}
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
				{#each getFormFieldIssues(fields.job.description) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
		<Field.Separator />

		<!-- Application Method -->
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.job.appLinkOrEmail).length > 0}
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
					{...fields.job.appLinkOrEmail.as('text')}
					aria-invalid={getFormFieldIssues(fields.job.appLinkOrEmail).length > 0}
				/>
				{#each getFormFieldIssues(fields.job.appLinkOrEmail) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
		<Field.Separator />

		<!-- Application Deadline -->
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.job.applicationDeadline).length > 0}
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
								aria-invalid={getFormFieldIssues(fields.job.applicationDeadline).length > 0}
							>
								<CalendarIcon class="mr-2 size-4" />
								{deadlineLabel}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto overflow-hidden p-0" align="start">
						<Calendar
							type="single"
							value={fields.job.applicationDeadline.value()
								? parseDate(fields.job.applicationDeadline.value())
								: undefined}
							captionLayout="dropdown"
							onValueChange={(date) => {
								if (date) {
									fields.job.applicationDeadline.set(date.toString());
								}
								deadlinePopoverOpen = false;
							}}
							minValue={today(getLocalTimeZone())}
						/>
					</Popover.Content>
				</Popover.Root>
				{#each getFormFieldIssues(fields.job.applicationDeadline) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
	</Field.Group>
</Field.Set>
