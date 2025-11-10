<script lang="ts">
	import { submitJobPosting, type JobPostingFormData } from './post-job.remote';

	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Container } from '$lib/components/ui/container/index.js';
	import { Heading } from '$lib/components/ui/heading/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Section from '$lib/components/ui/section';
	import * as Intro from '$lib/components/ui/intro';
	import { EdraEditor, EdraDragHandleExtended } from '$lib/components/edra/shadcn';
	import JobDescriptionToolbar from '$lib/components/edra/shadcn/JobDescriptionToolbar.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Avatar from '$lib/components/ui/avatar';

	// Icons
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';

	import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
	import type { Content, Editor } from '@tiptap/core';
	import { Wrapper } from '$lib/components/ui/wrapper';

	// Job type options
	const jobTypes = [
		'Full Time',
		'Part Time',
		'Contractor',
		'Temporary',
		'Intern',
		'Volunteer',
		'Other'
	] as const;
	const seniorityLevels = [
		'Entry-level',
		'Mid-level',
		'Senior',
		'Manager',
		'Director',
		'Executive'
	] as const;
	const locationTypes = [
		{ value: 'remote', label: 'Remote' },
		{ value: 'hybrid', label: 'Hybrid' },
		{ value: 'onsite', label: 'On-site' }
	] as const;
	const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

	// Form state
	let selectedJobType = $state<(typeof jobTypes)[number]>();
	let selectedSeniority = $state<Array<(typeof seniorityLevels)[number]>>([]);
	let selectedLocationType = $state('remote');
	let selectedHiringLocationType = $state('worldwide');
	let selectedWorkingPermitsType = $state('no-specific');
	let selectedCurrency = $state('USD');
	let salaryRange = $state([50000, 150000]);
	let applicationDeadline = $state<CalendarDate | undefined>();
	let deadlinePopoverOpen = $state(false);
	let featureInEmails = $state(false);

	// Editor state for job description
	let jobDescriptionEditor = $state<Editor>();
	let jobDescriptionContent = $state<Content>();
	let jobDescriptionJSON = $state('');

	const previewData = $derived.by(() => {
		return {
			companyName: submitJobPosting.fields.organization.name.value() || 'Your Company Inc.',
			jobTitle: submitJobPosting.fields.job.title.value() || 'Job Title',
			salaryRange: [
				submitJobPosting.fields.salary.min.value() ?? 0,
				submitJobPosting.fields.salary.max.value() ?? 0
			],
			currency: submitJobPosting.fields.salary.currency.value() || 'USD',
			jobType: selectedJobType || 'Full Time'
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

	// Helper to safely get field issues
	function getIssues(field: any) {
		return field?.issues?.() ?? [];
	}

	// Handler for editor updates
	function onJobDescriptionUpdate() {
		if (jobDescriptionEditor && !jobDescriptionEditor.isDestroyed) {
			jobDescriptionContent = jobDescriptionEditor.getJSON();
			// Store JSON for database (allows editor restoration)
			jobDescriptionJSON = JSON.stringify(jobDescriptionContent);
		}
	}

	// Pricing calculations
	const BASE_PRICE = 99;
	const EMAIL_FEATURE_PRICE = 50;
</script>

<Intro.Root>
	<Intro.Title>Post a Job</Intro.Title>
	<Intro.Description>
		Your job post will be pinned to the top and highlighted in relevant search results for 30 days.
	</Intro.Description>
</Intro.Root>

<Section.Root>
	<Section.Content animate={true} animateDelay={0.45}>
		<form {...submitJobPosting} class="w-full space-y-8">
			<div class="space-y-4">
				<Field.Group title="Job Information" description="Basic details about the position">
					<!-- Job Title -->
					<Field.Field data-invalid={getIssues(submitJobPosting.fields.job.title).length > 0}>
						<Field.Label for="job-title">Job Title *</Field.Label>
						<Input
							id="job-title"
							placeholder="e.g. Senior Software Engineer"
							{...submitJobPosting.fields.job.title.as('text')}
							aria-invalid={getIssues(submitJobPosting.fields.job.title).length > 0}
						/>
						<Field.Description>Maximum 80 characters</Field.Description>
						{#each getIssues(submitJobPosting.fields.job.title) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>

					<!-- Job Type -->
					<Field.Field data-invalid={getIssues(submitJobPosting.fields.job.type).length > 0}>
						<Field.Label for="job-type">Job Type *</Field.Label>
						<Select.Root type="single" bind:value={selectedJobType}>
							<Select.Trigger id="job-type">
								{#if selectedJobType}
									{selectedJobType}
								{:else}
									Select job type
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each jobTypes as type (type)}
									<Select.Item value={type}>{type}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<input
							{...submitJobPosting.fields.job.type.as('text')}
							type="hidden"
							value={selectedJobType}
						/>
						{#each getIssues(submitJobPosting.fields.job.type) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>

					<!-- Seniority Levels -->
					<Field.Field data-invalid={getIssues(submitJobPosting.fields.job.seniority).length > 0}>
						<Field.Label>Seniority Level(s) *</Field.Label>
						<Field.Description>Select all that apply</Field.Description>
						<Field.Group class="gap-3">
							{#each seniorityLevels as level (level)}
								<Field.Field orientation="horizontal">
									<Checkbox
										id="seniority-{level}"
										checked={selectedSeniority.includes(level)}
										onchange={(e) => {
											if (e.currentTarget?.checked) {
												selectedSeniority = [...selectedSeniority, level];
											} else {
												selectedSeniority = selectedSeniority.filter((s) => s !== level);
											}
										}}
									/>
									<Field.Label for="seniority-{level}" class="font-normal">
										{level}
									</Field.Label>
								</Field.Field>
							{/each}
						</Field.Group>
						<input
							{...submitJobPosting.fields.job.seniority.as('text')}
							type="hidden"
							value={JSON.stringify(selectedSeniority)}
						/>
						{#each getIssues(submitJobPosting.fields.job.seniority) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>

					<!-- Job Description -->
					<Field.Field data-invalid={getIssues(submitJobPosting.fields.job.description).length > 0}>
						<Field.Label for="job-description">Job Description *</Field.Label>
						<div
							id="job-description"
							class="rounded-md border border-input bg-background"
							aria-invalid={getIssues(submitJobPosting.fields.job.description).length > 0}
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
							type="hidden"
							{...submitJobPosting.fields.job.description.as('text')}
							value={jobDescriptionJSON}
						/>
						<Field.Description>Provide a detailed description of the position</Field.Description>
						{#each getIssues(submitJobPosting.fields.job.description) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>

					<!-- Application Method -->
					<Field.Field
						data-invalid={getIssues(submitJobPosting.fields.job.appLinkOrEmail).length > 0}
					>
						<Field.Label for="job-application">Application Link or Email *</Field.Label>
						<Input
							id="job-application"
							placeholder="https://careers.company.com/apply or jobs@company.com"
							{...submitJobPosting.fields.job.appLinkOrEmail.as('text')}
							aria-invalid={getIssues(submitJobPosting.fields.job.appLinkOrEmail).length > 0}
						/>
						<Field.Description
							>Enter a URL or email address where candidates can apply</Field.Description
						>
						{#each getIssues(submitJobPosting.fields.job.appLinkOrEmail) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>

					<!-- Application Deadline -->
					<Field.Field
						data-invalid={getIssues(submitJobPosting.fields.job.applicationDeadline).length > 0}
					>
						<Field.Label for="job-deadline">Application Deadline *</Field.Label>
						<Popover.Root bind:open={deadlinePopoverOpen}>
							<Popover.Trigger id="job-deadline">
								{#snippet child({ props })}
									<Button
										{...props}
										variant="outline"
										class="w-full justify-start font-normal"
										aria-invalid={getIssues(submitJobPosting.fields.job.applicationDeadline)
											.length > 0}
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
						<Field.Description>Select the last day candidates can apply</Field.Description>
						{#each getIssues(submitJobPosting.fields.job.applicationDeadline) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>
				</Field.Group>
			</div>

			<!-- Location Section -->
			<div class="space-y-4">
				<Field.Group
					title="Location & Work Arrangement"
					description="Specify where and how the work will be performed"
				>
					<!-- Location Type -->
					<Field.Field>
						<Field.Label for="location-type">Location Type *</Field.Label>
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
					</Field.Field>

					<!-- Hiring Location Type -->
					<Field.Field>
						<Field.Label>Hiring Location *</Field.Label>
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
					</Field.Field>

					{#if selectedHiringLocationType === 'timezone'}
						<Field.Field>
							<Field.Label for="timezones">Allowed Timezones</Field.Label>
							<Input
								id="timezones"
								placeholder="e.g., America/New_York, Europe/London (comma separated)"
								{...submitJobPosting.fields.hiringLocation.timezones.as('text')}
							/>
							<Field.Description>Enter timezone identifiers separated by commas</Field.Description>
						</Field.Field>
					{/if}
				</Field.Group>
			</div>

			<!-- Working Permits Section -->
			<div class="space-y-4">
				<Field.Group
					title="Working Permits"
					description="Specify any visa or work permit requirements"
				>
					<Field.Field>
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
					</Field.Field>

					{#if selectedWorkingPermitsType === 'required'}
						<Field.Field>
							<Field.Label for="required-permits">Required Permits</Field.Label>
							<Input
								id="required-permits"
								placeholder="e.g., US Work Authorization, EU Work Permit (comma separated)"
								{...submitJobPosting.fields.workingPermits.permits.as('text')}
							/>
							<Field.Description>Enter required permits separated by commas</Field.Description>
						</Field.Field>
					{/if}
				</Field.Group>
			</div>

			<!-- Salary Section -->
			<div class="space-y-4">
				<Field.Group
					title="Salary Range"
					description="Optionally specify the annual salary range for this position"
				>
					<div class="grid md:grid-cols-4">
						<Field.Field class="md:col-span-3">
							<div class="flex items-center gap-x-4">
								<Field.Label>Annual Salary Range</Field.Label>
								<Field.Description>
									${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
									{selectedCurrency}
									per year
								</Field.Description>
							</div>

							<Slider
								type="multiple"
								bind:value={salaryRange}
								max={500000}
								min={0}
								step={5000}
								class="mt-2 w-full"
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
							{#each getIssues(submitJobPosting.fields.salary.min) as issue, i (i)}
								<Field.Error>{issue.message}</Field.Error>
							{/each}
							{#each getIssues(submitJobPosting.fields.salary.max) as issue, i (i)}
								<Field.Error>{issue.message}</Field.Error>
							{/each}
						</Field.Field>

						<Field.Field class="mt-4 md:mt-0 md:ml-4">
							<Field.Label for="salary-currency">Currency</Field.Label>
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
						</Field.Field>
					</div>
				</Field.Group>
			</div>

			<!-- Company Information Section -->
			<div class="space-y-4">
				<Field.Group title="Company Information" description="Details about your organization">
					<Field.Field
						data-invalid={getIssues(submitJobPosting.fields.organization.name).length > 0}
					>
						<Field.Label for="company-name">Company Name *</Field.Label>
						<Input
							id="company-name"
							placeholder="Your Company Inc."
							{...submitJobPosting.fields.organization.name.as('text')}
							aria-invalid={getIssues(submitJobPosting.fields.organization.name).length > 0}
						/>
						{#each getIssues(submitJobPosting.fields.organization.name) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>

					<Field.Field
						data-invalid={getIssues(submitJobPosting.fields.organization.url).length > 0}
					>
						<Field.Label for="company-url">Company Website *</Field.Label>
						<Input
							id="company-url"
							placeholder="https://yourcompany.com"
							{...submitJobPosting.fields.organization.url.as('text')}
							type="url"
							aria-invalid={getIssues(submitJobPosting.fields.organization.url).length > 0}
						/>
						{#each getIssues(submitJobPosting.fields.organization.url) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>

					<Field.Field>
						<Field.Label for="company-logo">Company Logo URL</Field.Label>
						<Input
							id="company-logo"
							placeholder="https://yourcompany.com/logo.png"
							{...submitJobPosting.fields.organization.logo.as('text')}
							type="url"
						/>
						<Field.Description>Optional: URL to your company logo</Field.Description>
					</Field.Field>

					<Field.Field data-invalid={getIssues(submitJobPosting.fields.customerEmail).length > 0}>
						<Field.Label for="customer-email">Your Email *</Field.Label>
						<Input
							id="customer-email"
							placeholder="you@company.com"
							{...submitJobPosting.fields.customerEmail.as('text')}
							type="email"
							aria-invalid={getIssues(submitJobPosting.fields.customerEmail).length > 0}
						/>
						<Field.Description
							>We'll send payment confirmation and job posting updates here</Field.Description
						>
						{#each getIssues(submitJobPosting.fields.customerEmail) as issue, i (i)}
							<Field.Error>{issue.message}</Field.Error>
						{/each}
					</Field.Field>
				</Field.Group>
			</div>

			<!-- Upgrades Section -->
			<div class="space-y-4">
				<Field.Group title="Upgrades" description="Enhance your job posting visibility">
					<div
						class="rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
					>
						<Field.Field orientation="horizontal" class="items-start gap-3">
							<Checkbox id="feature-in-emails" bind:checked={featureInEmails} class="mt-1" />
							<Field.Content class="space-y-1">
								<Field.Label for="feature-in-emails" class="text-base leading-none font-semibold">
									Feature in Email Newsletter
									<Badge variant="secondary" class="ml-2">+${EMAIL_FEATURE_PRICE}</Badge>
								</Field.Label>
								<Field.Description class="text-sm">
									Include your job posting in our weekly newsletter sent to thousands of job seekers
								</Field.Description>
							</Field.Content>
						</Field.Field>
						<input
							{...submitJobPosting.fields.upgrades.featureInEmails.as('checkbox')}
							type="hidden"
							checked={featureInEmails}
						/>
					</div>
				</Field.Group>
			</div>

			<!-- Submit Section -->
			<div class="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-between">
				<Button type="button" variant="outline" size="lg" class="order-2 sm:order-1">
					Save as Draft
				</Button>
				<Button
					type="submit"
					size="lg"
					class="order-1 bg-gradient-to-r from-primary to-primary/80 sm:order-2"
				>
					<CheckCircleIcon class="mr-2 size-5" />
					Publish Job Posting
				</Button>
			</div>
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
						<Item.Description class="text-pretty">$199 USD</Item.Description>
					</Item.Header>
					<Item.Footer class="block text-xs">
						Job post will be <span class="font-medium">pinned</span> for 30 days.
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

				<button
					class="bg-primary-700 hover:bg-primary-800 active:bg-primary-800 disabled:bg-primary-200 focus:ring-primary-100 inline-flex h-max w-full items-center justify-center gap-x-2 rounded-lg border border-transparent px-4.5 py-2.5 text-base font-medium text-white shadow-[0rem_-0.0625rem_0rem_0.0625rem_rgba(107,_70,_193,_0.8)_inset,_0rem_0rem_0rem_0.0625rem_#6B46C1_inset,_0rem_0.03125rem_0rem_0.09375rem_hsla(0,_0%,_100%,_0.25)_inset] transition-colors hover:shadow-[0rem_-0.0625rem_0rem_0.0625rem_rgba(85,_60,_154,_0.8)_inset,_0rem_0rem_0rem_0.0625rem_#553C9A_inset,_0rem_0.03125rem_0rem_0.09375rem_hsla(0,_0%,_100%,_0.25)_inset] focus:ring-4 focus:outline-none active:translate-y-[0.5px] active:shadow-[0px_3px_0px_0px_#553C9A_inset] disabled:cursor-not-allowed disabled:shadow-xs disabled:hover:shadow-xs"
					type="button">Post job for $199 USD</button
				>
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
