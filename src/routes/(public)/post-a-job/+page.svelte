<script lang="ts">
	import { submitJobPosting, type JobPostingFormData } from './post-job.remote';

	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Container } from '$lib/components/ui/container/index.js';
	import { Heading } from '$lib/components/ui/heading/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';

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

	// Helpers for Select component display
	const jobTypeLabel = $derived(selectedJobType ?? 'Select job type');
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
</script>

<Container class="py-12">
	<div class="mx-auto max-w-3xl">
		<Heading as="h1" class="mb-2">Post a Job</Heading>
		<p class="mb-8 text-muted-foreground">
			Fill out the form below to post your job listing. All fields marked with * are required.
		</p>

		{#if submitJobPosting.fields}
			<form {...submitJobPosting} class="space-y-8">
				<!-- Job Information Section -->
				<Field.Set>
					<Field.Legend>Job Information</Field.Legend>
					<Field.Description>Basic details about the position</Field.Description>
					<Field.Separator />

					<Field.Group>
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
									{jobTypeLabel}
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
								type="hidden"
								{...submitJobPosting.fields.job.seniority.as('text')}
								value={JSON.stringify(selectedSeniority)}
							/>
							{#each getIssues(submitJobPosting.fields.job.seniority) as issue, i (i)}
								<Field.Error>{issue.message}</Field.Error>
							{/each}
						</Field.Field>

						<!-- Job Description -->
						<Field.Field
							data-invalid={getIssues(submitJobPosting.fields.job.description).length > 0}
						>
							<Field.Label for="job-description">Job Description *</Field.Label>
							<Textarea
								id="job-description"
								placeholder="Describe the role, responsibilities, requirements, and benefits..."
								rows={8}
								class="resize-y"
								{...submitJobPosting.fields.job.description.as('text')}
								aria-invalid={getIssues(submitJobPosting.fields.job.description).length > 0}
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
				</Field.Set>

				<!-- Location Section -->
				<Field.Set>
					<Field.Legend>Location & Work Arrangement</Field.Legend>
					<Field.Description>Specify where and how the work will be performed</Field.Description>
					<Field.Separator />

					<Field.Group>
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
								type="hidden"
								{...submitJobPosting.fields.locationType.as('text')}
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
								<Field.Description>Enter timezone identifiers separated by commas</Field.Description
								>
							</Field.Field>
						{/if}
					</Field.Group>
				</Field.Set>

				<!-- Working Permits Section -->
				<Field.Set>
					<Field.Legend>Working Permits</Field.Legend>
					<Field.Description>Specify any visa or work permit requirements</Field.Description>
					<Field.Separator />

					<Field.Group>
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
				</Field.Set>

				<!-- Salary Section -->
				<Field.Set>
					<Field.Legend>Salary Information</Field.Legend>
					<Field.Description>Optional salary details</Field.Description>
					<Field.Separator />

					<Field.Group>
						<Field.Field>
							<Field.Label>Annual Salary Range</Field.Label>
							<Field.Description>
								${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
								{selectedCurrency}
								per year
							</Field.Description>
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

						<Field.Field>
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
								{...submitJobPosting.fields.salary.currency.as('string')}
								type="hidden"
								value={selectedCurrency}
							/>
						</Field.Field>
					</Field.Group>
				</Field.Set>

				<!-- Company Information Section -->
				<Field.Set>
					<Field.Legend>Company Information</Field.Legend>
					<Field.Description>Details about your organization</Field.Description>
					<Field.Separator />

					<Field.Group>
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
					</Field.Group>
				</Field.Set>

				<!-- Contact Information Section -->
				<Field.Set>
					<Field.Legend>Contact Information</Field.Legend>
					<Field.Description>Where we can reach you about this posting</Field.Description>
					<Field.Separator />

					<Field.Group>
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
				</Field.Set>

				<!-- Upgrades Section -->
				<Field.Set>
					<Field.Legend>Optional Upgrades</Field.Legend>
					<Field.Description>Enhance your job posting visibility</Field.Description>
					<Field.Separator />

					<Field.Group>
						<Field.Field orientation="horizontal">
							<Checkbox id="feature-in-emails" bind:checked={featureInEmails} />
							<Field.Content>
								<Field.Label for="feature-in-emails">
									Feature in Email Newsletter (+$50)
								</Field.Label>
								<Field.Description>
									Include your job posting in our weekly newsletter sent to thousands of job seekers
								</Field.Description>
							</Field.Content>
						</Field.Field>
						<input
							{...submitJobPosting.fields.upgrades.featureInEmails.as('checkbox')}
							type="hidden"
							checked={featureInEmails}
						/>
					</Field.Group>
				</Field.Set>

				<!-- Submit Section -->
				<Field.Field orientation="horizontal" class="pt-4">
					<Button type="submit" size="lg">Publish Job Posting</Button>
					<Button type="button" variant="outline" size="lg">Save as Draft</Button>
				</Field.Field>
			</form>
		{/if}
	</div>
</Container>
