<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Empty,
		EmptyContent,
		EmptyDescription,
		EmptyHeader,
		EmptyTitle
	} from '$lib/components/ui/empty';
	import { FileText, MapPin, Briefcase, Clock } from '@lucide/svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const statusOptions = [
		{ value: 'all', label: 'All Applications' },
		{ value: 'modal_shown', label: 'Modal Shown' },
		{ value: 'cta_clicked', label: 'CTA Clicked' },
		{ value: 'external_opened', label: 'External Opened' }
	];

	let selectedStatus = $state(data.statusFilter);

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDateTime(date: Date): string {
		return new Date(date).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
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

	function handleStatusChange(value: string) {
		selectedStatus = value;
		const url = new URL($page.url);
		if (value === 'all') {
			url.searchParams.delete('status');
		} else {
			url.searchParams.set('status', value);
		}
		goto(url.toString(), { keepFocus: true, noScroll: true });
	}

	// Get applications to display based on filter
	let displayApplications = $derived.by(() => {
		if (selectedStatus === 'all') {
			return data.applications;
		}
		return data.groupedApplications[selectedStatus as keyof typeof data.groupedApplications] || [];
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Applications</h1>
			<p class="text-muted-foreground">Track your job application progress</p>
		</div>
		<Select type="single" value={selectedStatus} onValueChange={handleStatusChange}>
			<SelectTrigger class="w-[200px]">
				{statusOptions.find((opt) => opt.value === selectedStatus)?.label || 'All Applications'}
			</SelectTrigger>
			<SelectContent>
				{#each statusOptions as option (option.value)}
					<SelectItem value={option.value}>
						{option.label}
					</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	</div>

	{#if displayApplications.length === 0}
		<Empty>
			<EmptyContent>
				<EmptyHeader>
					<FileText class="h-12 w-12" />
					<EmptyTitle>
						{selectedStatus === 'all' ? 'No applications yet' : 'No applications in this status'}
					</EmptyTitle>
				</EmptyHeader>
				<EmptyDescription>
					{#if selectedStatus === 'all'}
						Start applying to jobs to track your applications here
					{:else}
						Try selecting a different status filter
					{/if}
				</EmptyDescription>
				{#if selectedStatus === 'all'}
					<Button href="/jobs" class="mt-4">Browse Jobs</Button>
				{/if}
			</EmptyContent>
		</Empty>
	{:else}
		<div class="space-y-4">
			{#each displayApplications as application (application.id)}
				<Card>
					<CardHeader>
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 space-y-2">
								<div class="flex items-center gap-2">
									<CardTitle class="text-xl">
										{application.job.title}
									</CardTitle>
									<Badge variant={getStatusVariant(application.status)}>
										{getStatusLabel(application.status)}
									</Badge>
								</div>
								<p class="text-sm font-medium text-muted-foreground">
									{application.job.organization.name}
								</p>
								<div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
									{#if application.job.location}
										<span class="flex items-center gap-1">
											<MapPin class="h-3 w-3" />
											{application.job.location}
										</span>
									{/if}
									{#if application.job.jobType}
										<span class="flex items-center gap-1">
											<Briefcase class="h-3 w-3" />
											{application.job.jobType}
										</span>
									{/if}
								</div>
							</div>
							<Button href="/jobs/{application.job.slug}" variant="outline" size="sm">
								View Job
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							<div class="text-sm">
								<h4 class="mb-2 font-medium">Application Timeline</h4>
								<div class="space-y-1.5 text-muted-foreground">
									{#if application.modalShownAt}
										<div class="flex items-center gap-2">
											<Clock class="h-3 w-3" />
											<span>Modal shown: {formatDateTime(application.modalShownAt)}</span>
										</div>
									{/if}
									{#if application.ctaClickedAt}
										<div class="flex items-center gap-2">
											<Clock class="h-3 w-3" />
											<span>CTA clicked: {formatDateTime(application.ctaClickedAt)}</span>
										</div>
									{/if}
									{#if application.externalOpenedAt}
										<div class="flex items-center gap-2">
											<Clock class="h-3 w-3" />
											<span>External opened: {formatDateTime(application.externalOpenedAt)}</span>
										</div>
									{/if}
								</div>
							</div>
							<p class="text-xs text-muted-foreground">
								Started {formatDate(application.createdAt)}
							</p>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}

	<!-- Summary Stats -->
	{#if data.applications.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Summary</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4 md:grid-cols-3">
					<div class="space-y-1">
						<p class="text-sm font-medium text-muted-foreground">Modal Shown</p>
						<p class="text-2xl font-bold">{data.groupedApplications.modal_shown.length}</p>
					</div>
					<div class="space-y-1">
						<p class="text-sm font-medium text-muted-foreground">CTA Clicked</p>
						<p class="text-2xl font-bold">{data.groupedApplications.cta_clicked.length}</p>
					</div>
					<div class="space-y-1">
						<p class="text-sm font-medium text-muted-foreground">External Opened</p>
						<p class="text-2xl font-bold">{data.groupedApplications.external_opened.length}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
