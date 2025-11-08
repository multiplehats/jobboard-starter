<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Briefcase,
		FileText,
		Eye,
		Users,
		Plus,
		BarChart3,
		Clock,
		CheckCircle2,
		CreditCard,
		AlertCircle
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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
</script>

<div class="space-y-8">
	<!-- Welcome Header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
		<p class="text-muted-foreground">
			Welcome back, {data.user?.name || 'User'}! Here's what's happening with your jobs.
		</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<!-- Total Jobs -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Jobs</CardTitle>
				<Briefcase class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.total}</div>
				<p class="text-xs text-muted-foreground">All time</p>
			</CardContent>
		</Card>

		<!-- Published Jobs -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Published</CardTitle>
				<CheckCircle2 class="h-4 w-4 text-green-600" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.published}</div>
				<p class="text-xs text-muted-foreground">Live jobs</p>
			</CardContent>
		</Card>

		<!-- Draft Jobs -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Drafts</CardTitle>
				<FileText class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.draft}</div>
				<p class="text-xs text-muted-foreground">Unpublished</p>
			</CardContent>
		</Card>

		<!-- Total Applications -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Applications</CardTitle>
				<Users class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.totalApplications}</div>
				<p class="text-xs text-muted-foreground">Total received</p>
			</CardContent>
		</Card>

		<!-- Total Views -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Views</CardTitle>
				<Eye class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.totalViews}</div>
				<p class="text-xs text-muted-foreground">Job page views</p>
			</CardContent>
		</Card>

		<!-- Awaiting Payment -->
		{#if data.stats.awaitingPayment > 0}
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Awaiting Payment</CardTitle>
					<CreditCard class="h-4 w-4 text-orange-600" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{data.stats.awaitingPayment}</div>
					<p class="text-xs text-muted-foreground">Action required</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Awaiting Approval -->
		{#if data.stats.awaitingApproval > 0}
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Awaiting Approval</CardTitle>
					<Clock class="h-4 w-4 text-blue-600" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{data.stats.awaitingApproval}</div>
					<p class="text-xs text-muted-foreground">Under review</p>
				</CardContent>
			</Card>
		{/if}
	</div>

	<!-- Quick Actions -->
	<div class="flex flex-wrap gap-3">
		<Button href="/dashboard/recruiter/jobs/new" class="gap-2">
			<Plus class="h-4 w-4" />
			Post New Job
		</Button>
		<Button href="/dashboard/recruiter/analytics" variant="outline" class="gap-2">
			<BarChart3 class="h-4 w-4" />
			View Analytics
		</Button>
	</div>

	<!-- Recent Jobs -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-bold tracking-tight">Recent Jobs</h2>
			<Button href="/dashboard/recruiter/jobs" variant="link">View All Jobs</Button>
		</div>

		{#if data.recentJobs.length === 0}
			<Card>
				<CardContent class="flex flex-col items-center justify-center py-12">
					<Briefcase class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="mb-2 text-lg font-semibold">No jobs yet</h3>
					<p class="mb-4 text-sm text-muted-foreground">Get started by posting your first job</p>
					<Button href="/dashboard/recruiter/jobs/new" class="gap-2">
						<Plus class="h-4 w-4" />
						Post Your First Job
					</Button>
				</CardContent>
			</Card>
		{:else}
			<div class="grid gap-4">
				{#each data.recentJobs as job}
					{@const StatusIcon = getStatusIcon(job.status)}
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
									<div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
										<span class="flex items-center gap-1">
											<Building2 class="h-3 w-3" />
											{job.organization.name}
										</span>
										{#if job.location}
											<span>•</span>
											<span>{job.location}</span>
										{/if}
										<span>•</span>
										<span class="capitalize">{job.locationType.replace('_', ' ')}</span>
									</div>
								</div>
								<Badge variant={getStatusBadgeVariant(job.status)} class="ml-2 gap-1">
									<StatusIcon class="h-3 w-3" />
									{formatStatus(job.status)}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div class="flex flex-wrap gap-6 text-sm text-muted-foreground">
								<span class="flex items-center gap-1">
									<Eye class="h-4 w-4" />
									{job.viewCount} views
								</span>
								<span class="flex items-center gap-1">
									<Users class="h-4 w-4" />
									{job.applicationCount} applications
								</span>
								<span class="flex items-center gap-1">
									<Clock class="h-4 w-4" />
									Posted {formatDate(job.createdAt)}
								</span>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>

<script module>
	import { Building2 } from '@lucide/svelte';
</script>
