<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Extract description from JSON (for now it's just wrapped content)
	const descriptionText = typeof data.job.description === 'object' && data.job.description !== null
		? (data.job.description as any).content || ''
		: '';

	// Form data with pre-filled values
	let formData = $state({
		title: data.job.title,
		organizationId: data.job.organizationId,
		locationType: data.job.locationType,
		location: data.job.location || '',
		jobType: data.job.jobType,
		description: descriptionText,
		salaryMin: data.job.salaryMin?.toString() || '',
		salaryMax: data.job.salaryMax?.toString() || '',
		salaryCurrency: data.job.salaryCurrency || 'USD',
		salaryPeriod: data.job.salaryPeriod || 'year',
		applicationUrl: data.job.applicationUrl,
		applicationEmail: data.job.applicationEmail || '',
		status: data.job.status as 'draft' | 'published'
	});

	let isSubmitting = $state(false);

	// Get selected organization name
	const selectedOrg = $derived(
		data.organizations.find((org) => org.id === formData.organizationId)
	);

	// Status badge variant
	const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
		switch (status) {
			case 'published':
				return 'default'; // Green-ish (primary)
			case 'draft':
				return 'secondary';
			case 'awaiting_payment':
				return 'outline'; // Warning style
			case 'awaiting_approval':
				return 'outline';
			case 'expired':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const formatStatus = (status: string) => {
		return status
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};
</script>

<div class="mx-auto max-w-3xl space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button href="/dashboard/recruiter/jobs" variant="ghost" size="icon">
			<ArrowLeft class="h-5 w-5" />
		</Button>
		<div class="flex-1">
			<h1 class="text-3xl font-bold tracking-tight">Edit Job</h1>
			<p class="text-muted-foreground">Update your job posting</p>
		</div>
		<Badge variant={getStatusBadgeVariant(data.job.status)}>
			{formatStatus(data.job.status)}
		</Badge>
	</div>

	<!-- Job Info Card -->
	<Card>
		<CardHeader>
			<CardTitle>Job Information</CardTitle>
			<CardDescription>
				Last edited {data.job.editCount} time{data.job.editCount === 1 ? '' : 's'}
				{#if data.job.lastEditedAt}
					• Last edit: {new Date(data.job.lastEditedAt).toLocaleDateString()}
				{/if}
			</CardDescription>
		</CardHeader>
	</Card>

	<!-- Form -->
	<form method="POST" action="?/update" use:enhance={() => {
		isSubmitting = true;
		return async ({ result }) => {
			isSubmitting = false;
			if (result.type === 'failure') {
				toast.error((result.data?.message || 'Failed to update job') as string);
			} else if (result.type === 'success') {
				toast.success('Job updated successfully');
			}
		};
	}}>
		<!-- Basic Info -->
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Basic Information</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
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
							{formData.locationType.charAt(0).toUpperCase() + formData.locationType.slice(1)}
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
							{formData.jobType.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
			</CardContent>
		</Card>

		<!-- Job Details -->
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Job Details</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
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
			</CardContent>
		</Card>

		<!-- Application Settings -->
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Application Settings</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
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
				</div>

				<!-- Application Email -->
				<div class="space-y-2">
					<Label for="applicationEmail">Application Email (Optional)</Label>
					<Input
						id="applicationEmail"
						name="applicationEmail"
						type="email"
						bind:value={formData.applicationEmail}
						placeholder="jobs@example.com"
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Hidden inputs -->
		<input type="hidden" name="status" value={formData.status} />

		<!-- Action Buttons -->
		<div class="flex justify-between">
			<Button type="button" variant="outline" href="/dashboard/recruiter/jobs">
				Cancel
			</Button>

			<div class="flex gap-2">
				{#if data.job.status !== 'draft'}
					<Button
						type="submit"
						variant="outline"
						disabled={isSubmitting}
						onclick={() => (formData.status = 'draft')}
					>
						Save as Draft
					</Button>
				{/if}
				<Button
					type="submit"
					disabled={isSubmitting}
					onclick={() => (formData.status = formData.status === 'published' ? 'published' : 'draft')}
				>
					{isSubmitting ? 'Updating...' : 'Update Job'}
				</Button>
			</div>
		</div>
	</form>
</div>
