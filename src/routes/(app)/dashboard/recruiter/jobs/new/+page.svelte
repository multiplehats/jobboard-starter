<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Progress } from '$lib/components/ui/progress';
	import { toast } from 'svelte-sonner';
	import { ChevronLeft, ChevronRight, Check } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form state
	let currentStep = $state(1);
	const totalSteps = 4;

	// Form data
	let formData = $state({
		title: '',
		organizationId: data.organizations[0]?.id || '',
		locationType: '',
		location: '',
		jobType: '',
		description: '',
		salaryMin: '',
		salaryMax: '',
		salaryCurrency: 'USD',
		salaryPeriod: 'year',
		applicationUrl: '',
		applicationEmail: '',
		status: 'draft' as 'draft' | 'published'
	});

	let isSubmitting = $state(false);

	// Progress
	const progress = $derived((currentStep / totalSteps) * 100);

	// Step validation
	const canProceed = $derived.by(() => {
		switch (currentStep) {
			case 1:
				return (
					formData.title.trim() !== '' &&
					formData.organizationId !== '' &&
					formData.locationType !== '' &&
					formData.jobType !== ''
				);
			case 2:
				return formData.description.trim() !== '';
			case 3:
				return formData.applicationUrl.trim() !== '';
			case 4:
				return true;
			default:
				return false;
		}
	});

	// Navigation
	function nextStep() {
		if (currentStep < totalSteps && canProceed) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	// Get selected organization name
	const selectedOrg = $derived(
		data.organizations.find((org) => org.id === formData.organizationId)
	);
</script>

<div class="mx-auto max-w-3xl space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Post New Job</h1>
		<p class="text-muted-foreground">Create a new job posting for your organization</p>
	</div>

	<!-- Progress -->
	<div class="space-y-2">
		<div class="flex justify-between text-sm">
			<span class="text-muted-foreground">Step {currentStep} of {totalSteps}</span>
			<span class="text-muted-foreground">{Math.round(progress)}% Complete</span>
		</div>
		<Progress value={progress} />
	</div>

	<!-- Step Indicators -->
	<div class="flex justify-between">
		{#each Array(totalSteps) as _, i}
			{@const stepNum = i + 1}
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors {currentStep ===
					stepNum
						? 'border-primary bg-primary text-primary-foreground'
						: currentStep > stepNum
							? 'border-green-600 bg-green-600 text-white'
							: 'border-muted bg-background text-muted-foreground'}"
				>
					{#if currentStep > stepNum}
						<Check class="h-4 w-4" />
					{:else}
						{stepNum}
					{/if}
				</div>
				<span
					class="text-sm {currentStep === stepNum
						? 'font-medium text-foreground'
						: 'text-muted-foreground'}"
				>
					{#if stepNum === 1}
						Basic Info
					{:else if stepNum === 2}
						Details
					{:else if stepNum === 3}
						Application
					{:else}
						Review
					{/if}
				</span>
			</div>
		{/each}
	</div>

	<!-- Form -->
	<form method="POST" action="?/create" use:enhance={() => {
		isSubmitting = true;
		return async ({ result }) => {
			isSubmitting = false;
			if (result.type === 'failure') {
				toast.error((result.data?.message || 'Failed to create job') as string);
			}
		};
	}}>
		<Card>
			<CardHeader>
				<CardTitle>
					{#if currentStep === 1}
						Basic Information
					{:else if currentStep === 2}
						Job Details
					{:else if currentStep === 3}
						Application Settings
					{:else}
						Review & Publish
					{/if}
				</CardTitle>
				<CardDescription>
					{#if currentStep === 1}
						Enter the basic details about the job position
					{:else if currentStep === 2}
						Provide detailed information about the role and compensation
					{:else if currentStep === 3}
						Set up how candidates will apply for this position
					{:else}
						Review your job posting before publishing
					{/if}
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-6">
				<!-- Step 1: Basic Info -->
				{#if currentStep === 1}
					<div class="space-y-4">
						<!-- Title -->
						<div class="space-y-2">
							<Label for="title">Job Title *</Label>
							<Input
								id="title"
								name="title"
								bind:value={formData.title}
								placeholder="e.g. Senior Software Engineer"
								required
							/>
						</div>

						<!-- Organization -->
						<div class="space-y-2">
							<Label for="organizationId">Organization *</Label>
							<Select.Root
								type="single"
								value={formData.organizationId}
								onValueChange={(v) => {
									if (v) formData.organizationId = v;
								}}
							>
								<Select.Trigger>
									{selectedOrg?.name || 'Select organization'}
								</Select.Trigger>
								<Select.Content>
									{#each data.organizations as org}
										<Select.Item value={org.id}>{org.name}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="organizationId" value={formData.organizationId} />
						</div>

						<!-- Location Type -->
						<div class="space-y-2">
							<Label for="locationType">Location Type *</Label>
							<Select.Root
								type="single"
								value={formData.locationType}
								onValueChange={(v) => {
									if (v) formData.locationType = v;
								}}
							>
								<Select.Trigger>
									{formData.locationType ? formData.locationType.replace('_', ' ').charAt(0).toUpperCase() + formData.locationType.slice(1) : 'Select location type'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="remote">Remote</Select.Item>
									<Select.Item value="hybrid">Hybrid</Select.Item>
									<Select.Item value="onsite">On-site</Select.Item>
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="locationType" value={formData.locationType} />
						</div>

						<!-- Location -->
						<div class="space-y-2">
							<Label for="location">Location</Label>
							<Input
								id="location"
								name="location"
								bind:value={formData.location}
								placeholder="e.g. San Francisco, CA"
							/>
							<p class="text-xs text-muted-foreground">City and country/state</p>
						</div>

						<!-- Job Type -->
						<div class="space-y-2">
							<Label for="jobType">Job Type *</Label>
							<Select.Root
								type="single"
								value={formData.jobType}
								onValueChange={(v) => {
									if (v) formData.jobType = v;
								}}
							>
								<Select.Trigger>
									{formData.jobType ? formData.jobType.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Select job type'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="full_time">Full Time</Select.Item>
									<Select.Item value="part_time">Part Time</Select.Item>
									<Select.Item value="contract">Contract</Select.Item>
									<Select.Item value="freelance">Freelance</Select.Item>
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="jobType" value={formData.jobType} />
						</div>
					</div>

				<!-- Step 2: Details -->
				{:else if currentStep === 2}
					<div class="space-y-4">
						<!-- Description -->
						<div class="space-y-2">
							<Label for="description">Job Description *</Label>
							<Textarea
								id="description"
								name="description"
								bind:value={formData.description}
								placeholder="Describe the role, responsibilities, and requirements..."
								rows={10}
								required
							/>
							<p class="text-xs text-muted-foreground">
								Note: Rich text editor (Tiptap) will be integrated later. For now, use plain text.
							</p>
						</div>

						<!-- Salary Range -->
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="salaryMin">Minimum Salary</Label>
								<Input
									id="salaryMin"
									name="salaryMin"
									type="number"
									bind:value={formData.salaryMin}
									placeholder="50000"
								/>
							</div>

							<div class="space-y-2">
								<Label for="salaryMax">Maximum Salary</Label>
								<Input
									id="salaryMax"
									name="salaryMax"
									type="number"
									bind:value={formData.salaryMax}
									placeholder="100000"
								/>
							</div>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="salaryCurrency">Currency</Label>
								<Input
									id="salaryCurrency"
									name="salaryCurrency"
									bind:value={formData.salaryCurrency}
									placeholder="USD"
								/>
							</div>

							<div class="space-y-2">
								<Label for="salaryPeriod">Period</Label>
								<Select.Root
									type="single"
									value={formData.salaryPeriod}
									onValueChange={(v) => {
										if (v) formData.salaryPeriod = v;
									}}
								>
									<Select.Trigger>
										{formData.salaryPeriod.charAt(0).toUpperCase() + formData.salaryPeriod.slice(1)}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="year">Year</Select.Item>
										<Select.Item value="month">Month</Select.Item>
										<Select.Item value="hour">Hour</Select.Item>
									</Select.Content>
								</Select.Root>
								<input type="hidden" name="salaryPeriod" value={formData.salaryPeriod} />
							</div>
						</div>
					</div>

				<!-- Step 3: Application -->
				{:else if currentStep === 3}
					<div class="space-y-4">
						<!-- Application URL -->
						<div class="space-y-2">
							<Label for="applicationUrl">Application URL *</Label>
							<Input
								id="applicationUrl"
								name="applicationUrl"
								type="url"
								bind:value={formData.applicationUrl}
								placeholder="https://example.com/apply"
								required
							/>
							<p class="text-xs text-muted-foreground">
								Where should candidates apply? This could be your ATS, company careers page, or email.
							</p>
						</div>

						<!-- Application Email (Optional) -->
						<div class="space-y-2">
							<Label for="applicationEmail">Application Email (Optional)</Label>
							<Input
								id="applicationEmail"
								name="applicationEmail"
								type="email"
								bind:value={formData.applicationEmail}
								placeholder="jobs@example.com"
							/>
							<p class="text-xs text-muted-foreground">
								If candidates can also apply via email, add it here.
							</p>
						</div>
					</div>

				<!-- Step 4: Review -->
				{:else if currentStep === 4}
					<div class="space-y-6">
						<div class="rounded-lg border p-4">
							<h3 class="mb-4 font-semibold">Job Preview</h3>
							<dl class="space-y-3 text-sm">
								<div>
									<dt class="font-medium">Title</dt>
									<dd class="text-muted-foreground">{formData.title}</dd>
								</div>
								<div>
									<dt class="font-medium">Organization</dt>
									<dd class="text-muted-foreground">{selectedOrg?.name}</dd>
								</div>
								<div>
									<dt class="font-medium">Location</dt>
									<dd class="text-muted-foreground capitalize">
										{formData.locationType.replace('_', ' ')}
										{formData.location ? ` • ${formData.location}` : ''}
									</dd>
								</div>
								<div>
									<dt class="font-medium">Job Type</dt>
									<dd class="text-muted-foreground capitalize">
										{formData.jobType.replace('_', ' ')}
									</dd>
								</div>
								{#if formData.salaryMin || formData.salaryMax}
									<div>
										<dt class="font-medium">Salary</dt>
										<dd class="text-muted-foreground">
											{formData.salaryCurrency}
											{#if formData.salaryMin && formData.salaryMax}
												{parseInt(formData.salaryMin).toLocaleString()} - {parseInt(formData.salaryMax).toLocaleString()}
											{:else if formData.salaryMin}
												{parseInt(formData.salaryMin).toLocaleString()}+
											{:else if formData.salaryMax}
												Up to {parseInt(formData.salaryMax).toLocaleString()}
											{/if}
											/ {formData.salaryPeriod}
										</dd>
									</div>
								{/if}
								<div>
									<dt class="font-medium">Application URL</dt>
									<dd class="text-muted-foreground">{formData.applicationUrl}</dd>
								</div>
								{#if formData.applicationEmail}
									<div>
										<dt class="font-medium">Application Email</dt>
										<dd class="text-muted-foreground">{formData.applicationEmail}</dd>
									</div>
								{/if}
							</dl>
						</div>

						<p class="text-sm text-muted-foreground">
							Choose whether to save as a draft or publish immediately. Published jobs will be visible to candidates right away.
						</p>
					</div>
				{/if}

				<!-- Hidden inputs for submission -->
				<input type="hidden" name="status" value={formData.status} />
			</CardContent>
		</Card>

		<!-- Navigation Buttons -->
		<div class="flex justify-between">
			<Button
				type="button"
				variant="outline"
				onclick={prevStep}
				disabled={currentStep === 1}
				class="gap-2"
			>
				<ChevronLeft class="h-4 w-4" />
				Previous
			</Button>

			<div class="flex gap-2">
				{#if currentStep === totalSteps}
					<Button
						type="submit"
						variant="outline"
						disabled={isSubmitting || !canProceed}
						onclick={() => (formData.status = 'draft')}
					>
						Save as Draft
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || !canProceed}
						onclick={() => (formData.status = 'published')}
					>
						Publish Job
					</Button>
				{:else}
					<Button
						type="button"
						onclick={nextStep}
						disabled={!canProceed}
						class="gap-2"
					>
						Next
						<ChevronRight class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		</div>
	</form>
</div>
