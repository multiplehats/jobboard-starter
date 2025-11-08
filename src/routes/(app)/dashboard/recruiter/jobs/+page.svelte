<script lang="ts">
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import {
		Briefcase,
		Eye,
		Users,
		MousePointerClick,
		Bookmark,
		MoreVertical,
		Edit,
		Copy,
		Trash2,
		Building2,
		MapPin,
		DollarSign,
		CheckCircle2,
		FileText,
		Clock,
		CreditCard,
		AlertCircle
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Status tabs configuration
	const statusTabs = [
		{ value: '', label: 'All' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'published', label: 'Published' },
		{ value: 'awaiting_payment', label: 'Awaiting Payment' },
		{ value: 'awaiting_approval', label: 'Awaiting Approval' },
		{ value: 'expired', label: 'Expired' }
	];

	const currentTab = $derived(data.statusFilter || '');

	// Filter jobs based on current tab
	const filteredJobs = $derived(
		currentTab === ''
			? data.jobs
			: data.jobs.filter((job) => job.status === currentTab)
	);

	// Helper functions
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

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'published':
				return CheckCircle2;
			case 'draft':
				return FileText;
			case 'awaiting_payment':
				return CreditCard;
			case 'awaiting_approval':
				return Clock;
			case 'expired':
				return AlertCircle;
			default:
				return FileText;
		}
	};

	const formatStatus = (status: string) => {
		return status
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	const formatDate = (date: Date | null) => {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	const formatSalary = (min: number | null, max: number | null, currency: string | null, period: string | null) => {
		if (!min && !max) return null;
		const curr = currency || 'USD';
		const per = period || 'year';

		if (min && max) {
			return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()} / ${per}`;
		} else if (min) {
			return `${curr} ${min.toLocaleString()}+ / ${per}`;
		} else if (max) {
			return `Up to ${curr} ${max.toLocaleString()} / ${per}`;
		}
		return null;
	};

	// Actions
	let isSubmitting = $state(false);

	async function duplicateJob(jobId: string) {
		if (isSubmitting) return;
		isSubmitting = true;

		try {
			const formData = new FormData();
			formData.append('jobId', jobId);

			const response = await fetch('?/duplicate', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				toast.success('Job duplicated successfully');
				await invalidateAll();
			} else {
				toast.error(result.data?.message || 'Failed to duplicate job');
			}
		} catch (error) {
			toast.error('An error occurred while duplicating the job');
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteJob(jobId: string, jobTitle: string) {
		if (isSubmitting) return;

		if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
			return;
		}

		isSubmitting = true;

		try {
			const formData = new FormData();
			formData.append('jobId', jobId);

			const response = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				toast.success('Job deleted successfully');
				await invalidateAll();
			} else {
				toast.error(result.data?.message || 'Failed to delete job');
			}
		} catch (error) {
			toast.error('An error occurred while deleting the job');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">My Jobs</h1>
			<p class="text-muted-foreground">Manage all your job postings</p>
		</div>
		<Button href="/dashboard/recruiter/jobs/new">Post New Job</Button>
	</div>

	<!-- Tabs for filtering by status -->
	<Tabs.Root value={currentTab}>
		<Tabs.List class="grid w-full grid-cols-3 lg:grid-cols-6">
			{#each statusTabs as tab}
				<Tabs.Trigger value={tab.value}>
					<a href={tab.value ? `?status=${tab.value}` : '/dashboard/recruiter/jobs'}>
						{tab.label}
					</a>
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		{#each statusTabs as tab}
			<Tabs.Content value={tab.value} class="mt-6">
				{#if filteredJobs.length === 0}
					<!-- Empty state -->
					<Card>
						<CardContent class="flex flex-col items-center justify-center py-12">
							<Briefcase class="mb-4 h-12 w-12 text-muted-foreground" />
							<h3 class="mb-2 text-lg font-semibold">
								No {tab.label.toLowerCase()} jobs
							</h3>
							<p class="mb-4 text-sm text-muted-foreground">
								{#if tab.value === 'draft'}
									Start by creating a draft or publish an existing one
								{:else if tab.value === 'published'}
									Publish a job to see it here
								{:else}
									No jobs found with this status
								{/if}
							</p>
							{#if tab.value === '' || tab.value === 'draft'}
								<Button href="/dashboard/recruiter/jobs/new">Post New Job</Button>
							{/if}
						</CardContent>
					</Card>
				{:else}
					<!-- Jobs list -->
					<div class="grid gap-4">
						{#each filteredJobs as job}
							{@const StatusIcon = getStatusIcon(job.status)}
							{@const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
							<Card class="transition-shadow hover:shadow-md">
								<CardHeader>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<CardTitle class="text-lg">
												<a
													href="/dashboard/recruiter/jobs/{job.id}/edit"
													class="hover:underline"
												>
													{job.title}
												</a>
											</CardTitle>
											<div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
												<span class="flex items-center gap-1">
													<Building2 class="h-3 w-3" />
													{job.organization.name}
												</span>
												{#if job.location}
													<span class="flex items-center gap-1">
														<MapPin class="h-3 w-3" />
														{job.location}
													</span>
												{/if}
												<Badge variant="outline" class="capitalize">
													{job.locationType.replace('_', ' ')}
												</Badge>
												<Badge variant="outline" class="capitalize">
													{job.jobType.replace('_', ' ')}
												</Badge>
												{#if salary}
													<span class="flex items-center gap-1">
														<DollarSign class="h-3 w-3" />
														{salary}
													</span>
												{/if}
											</div>
										</div>
										<div class="ml-4 flex items-center gap-2">
											<Badge variant={getStatusBadgeVariant(job.status)} class="gap-1">
												<StatusIcon class="h-3 w-3" />
												{formatStatus(job.status)}
											</Badge>

											<!-- Actions menu -->
											<DropdownMenu.Root>
												<DropdownMenu.Trigger>
													<Button variant="ghost" size="icon">
														<MoreVertical class="h-4 w-4" />
													</Button>
												</DropdownMenu.Trigger>
												<DropdownMenu.Content align="end">
													<DropdownMenu.Item>
														<a href="/dashboard/recruiter/jobs/{job.id}/edit" class="flex items-center">
															<Edit class="mr-2 h-4 w-4" />
															Edit
														</a>
													</DropdownMenu.Item>
													<DropdownMenu.Item onclick={() => duplicateJob(job.id)}>
														<Copy class="mr-2 h-4 w-4" />
														Duplicate
													</DropdownMenu.Item>
													<DropdownMenu.Separator />
													<DropdownMenu.Item
														class="text-destructive"
														onclick={() => deleteJob(job.id, job.title)}
													>
														<Trash2 class="mr-2 h-4 w-4" />
														Delete
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<!-- Stats -->
									<div class="flex flex-wrap gap-6 text-sm text-muted-foreground">
										<span class="flex items-center gap-1">
											<Eye class="h-4 w-4" />
											{job.viewCount} views
										</span>
										<span class="flex items-center gap-1">
											<MousePointerClick class="h-4 w-4" />
											{job.clickCount} clicks
										</span>
										<span class="flex items-center gap-1">
											<Users class="h-4 w-4" />
											{job.applicationCount} applications
										</span>
										<span class="flex items-center gap-1">
											<Bookmark class="h-4 w-4" />
											{job.saveCount} saves
										</span>
									</div>

									<!-- Dates -->
									<div class="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
										<span>Created: {formatDate(job.createdAt)}</span>
										{#if job.publishedAt}
											<span>Published: {formatDate(job.publishedAt)}</span>
										{/if}
										{#if job.expiresAt}
											<span>Expires: {formatDate(job.expiresAt)}</span>
										{/if}
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		{/each}
	</Tabs.Root>
</div>
