<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Bookmark, FileText, Briefcase, User } from '@lucide/svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
		switch (status) {
			case 'modal_shown':
				return 'secondary';
			case 'cta_clicked':
				return 'default';
			case 'external_opened':
				return 'outline';
			default:
				return 'default';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'modal_shown':
				return 'Modal Shown';
			case 'cta_clicked':
				return 'CTA Clicked';
			case 'external_opened':
				return 'External Opened';
			default:
				return status;
		}
	}
</script>

<div class="space-y-6">
	<!-- Welcome Header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Welcome back!</h1>
		<p class="text-muted-foreground">Here's an overview of your job search activity</p>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-2">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Saved Jobs</CardTitle>
				<Bookmark class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.savedJobs}</div>
				<p class="text-xs text-muted-foreground">Jobs you've bookmarked</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Applications</CardTitle>
				<FileText class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.applications}</div>
				<p class="text-xs text-muted-foreground">Jobs you've applied to</p>
			</CardContent>
		</Card>
	</div>

	<!-- Quick Actions -->
	<Card>
		<CardHeader>
			<CardTitle>Quick Actions</CardTitle>
			<CardDescription>What would you like to do?</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-wrap gap-3">
			<Button href="/jobs" class="gap-2">
				<Briefcase class="h-4 w-4" />
				Browse Jobs
			</Button>
			<Button href="/dashboard/talent/profile" variant="outline" class="gap-2">
				<User class="h-4 w-4" />
				Edit Profile
			</Button>
		</CardContent>
	</Card>

	<!-- Recent Applications -->
	{#if data.recentApplications.length > 0}
		<Card>
			<CardHeader class="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Recent Applications</CardTitle>
					<CardDescription>Your latest job applications</CardDescription>
				</div>
				<Button href="/dashboard/talent/applications" variant="ghost" size="sm">View All</Button>
			</CardHeader>
			<CardContent class="space-y-4">
				{#each data.recentApplications as application (application.id)}
					<div class="flex items-start justify-between gap-4 rounded-lg border p-4">
						<div class="flex-1 space-y-1">
							<div class="flex items-center gap-2">
								<h3 class="font-semibold">{application.job.title}</h3>
								<Badge variant={getStatusVariant(application.status)}>
									{getStatusLabel(application.status)}
								</Badge>
							</div>
							<p class="text-sm text-muted-foreground">
								{application.job.organization.name}
							</p>
							<p class="text-xs text-muted-foreground">
								Applied {formatDate(application.createdAt)}
							</p>
						</div>
						<Button href="/jobs/{application.job.slug}" variant="outline" size="sm">
							View Job
						</Button>
					</div>
				{/each}
			</CardContent>
		</Card>
	{/if}

	<!-- Recently Saved Jobs -->
	{#if data.recentSavedJobs.length > 0}
		<Card>
			<CardHeader class="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Recently Saved Jobs</CardTitle>
					<CardDescription>Jobs you've bookmarked</CardDescription>
				</div>
				<Button href="/dashboard/talent/saved" variant="ghost" size="sm">View All</Button>
			</CardHeader>
			<CardContent class="space-y-4">
				{#each data.recentSavedJobs as savedJob (savedJob.id)}
					<div class="flex items-start justify-between gap-4 rounded-lg border p-4">
						<div class="flex-1 space-y-1">
							<h3 class="font-semibold">{savedJob.job.title}</h3>
							<p class="text-sm text-muted-foreground">
								{savedJob.job.organization.name}
							</p>
							{#if savedJob.job.location}
								<p class="text-xs text-muted-foreground">
									{savedJob.job.location}
								</p>
							{/if}
							<p class="text-xs text-muted-foreground">
								Saved {formatDate(savedJob.createdAt)}
							</p>
						</div>
						<Button href="/jobs/{savedJob.job.slug}" variant="outline" size="sm">View Job</Button>
					</div>
				{/each}
			</CardContent>
		</Card>
	{/if}

	<!-- Empty State -->
	{#if data.recentApplications.length === 0 && data.recentSavedJobs.length === 0}
		<Card>
			<CardContent class="flex flex-col items-center justify-center py-12">
				<Briefcase class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="mb-2 text-lg font-semibold">No activity yet</h3>
				<p class="mb-4 text-center text-sm text-muted-foreground">
					Start browsing jobs to save your favorites and apply
				</p>
				<Button href="/jobs">Browse Jobs</Button>
			</CardContent>
		</Card>
	{/if}
</div>
