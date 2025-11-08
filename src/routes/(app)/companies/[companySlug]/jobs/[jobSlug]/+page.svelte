<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import TiptapRenderer from '$lib/components/TiptapRenderer.svelte';
	import { formatRelativeTime, formatSalaryRange } from '$lib/utils/date';
	import { generateJobUrl } from '$lib/features/jobs/utils';
	import type { PageData } from './$types';
	import {
		MapPin,
		Briefcase,
		Building2,
		Heart,
		ExternalLink,
		DollarSign,
		Calendar,
		CheckCircle
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Application modal state
	let showApplicationModal = $state(false);
	let applicationStage = $state<'modal_shown' | 'cta_clicked' | 'external_opened'>('modal_shown');

	// Format location type
	function formatLocationType(type: string): string {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Format job type
	function formatJobType(type: string): string {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join('-');
	}

	// Get location type variant for badge
	function getLocationTypeVariant(
		type: string
	): 'default' | 'secondary' | 'outline' | 'destructive' {
		if (type === 'remote') return 'default';
		if (type === 'hybrid') return 'secondary';
		return 'outline';
	}

	// Handle apply button click
	function handleApplyClick() {
		showApplicationModal = true;
		applicationStage = 'modal_shown';
		// TODO: Track analytics - modal_shown
	}

	// Handle CTA click in modal
	function handleCtaClick() {
		applicationStage = 'cta_clicked';
		// TODO: Track analytics - cta_clicked
	}

	// Handle external link open
	function handleExternalOpen() {
		applicationStage = 'external_opened';
		// TODO: Track analytics - external_opened
		// Open external URL
		window.open(data.job.applicationUrl, '_blank', 'noopener,noreferrer');
		// Close modal after a short delay
		setTimeout(() => {
			showApplicationModal = false;
		}, 500);
	}

	// Handle save button click
	function handleSaveClick() {
		// TODO: Implement save functionality
		console.log('Save job:', data.job.id);
	}
</script>

<svelte:head>
	<title>{data.seo?.title || data.job.title}</title>
	{#if data.seo?.description}
		<meta name="description" content={data.seo.description} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="grid gap-8 lg:grid-cols-3">
		<!-- Main Content -->
		<div class="lg:col-span-2">
			<!-- Job Header -->
			<div class="mb-8">
				<div class="mb-4 flex items-start gap-4">
					{#if data.job.organization.logo}
						<img
							src={data.job.organization.logo}
							alt={data.job.organization.name}
							class="h-16 w-16 rounded-lg object-cover"
						/>
					{:else}
						<div class="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
							<Building2 class="h-8 w-8 text-muted-foreground" />
						</div>
					{/if}

					<div class="flex-1">
						<h1 class="text-3xl font-bold tracking-tight">{data.job.title}</h1>
						<a
							href="/companies/{data.job.organization.slug}"
							class="mt-1 text-lg text-muted-foreground hover:text-foreground"
						>
							{data.job.organization.name}
						</a>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					<Badge variant={getLocationTypeVariant(data.job.locationType)}>
						<MapPin class="mr-1 h-3 w-3" />
						{formatLocationType(data.job.locationType)}
					</Badge>
					<Badge variant="outline">
						<Briefcase class="mr-1 h-3 w-3" />
						{formatJobType(data.job.jobType)}
					</Badge>
					{#if data.job.location}
						<Badge variant="outline">
							<MapPin class="mr-1 h-3 w-3" />
							{data.job.location}
						</Badge>
					{/if}
					{#if data.job.publishedAt}
						<Badge variant="outline">
							<Calendar class="mr-1 h-3 w-3" />
							{formatRelativeTime(data.job.publishedAt)}
						</Badge>
					{/if}
				</div>

				{#if data.job.salaryMin || data.job.salaryMax}
					{@const salary = formatSalaryRange(
						data.job.salaryMin,
						data.job.salaryMax,
						data.job.salaryCurrency,
						data.job.salaryPeriod
					)}
					{#if salary}
						<div class="mt-4 flex items-center gap-2 text-lg font-semibold">
							<DollarSign class="h-5 w-5 text-muted-foreground" />
							{salary}
						</div>
					{/if}
				{/if}

				<div class="mt-6 flex flex-wrap gap-3">
					{#if data.hasApplied}
						<Button disabled class="gap-2">
							<CheckCircle class="h-4 w-4" />
							Applied
						</Button>
					{:else}
						<Button onclick={handleApplyClick} size="lg" class="gap-2">
							Apply Now
							<ExternalLink class="h-4 w-4" />
						</Button>
					{/if}

					{#if data.user && (data.userProfile?.state === 'talent' || data.userProfile?.state === 'both')}
						<Button
							variant={data.hasSaved ? 'default' : 'outline'}
							size="lg"
							onclick={handleSaveClick}
							class="gap-2"
						>
							<Heart class="h-4 w-4 {data.hasSaved ? 'fill-current' : ''}" />
							{data.hasSaved ? 'Saved' : 'Save'}
						</Button>
					{/if}
				</div>
			</div>

			<!-- Job Description -->
			{#if data.job.description}
				<Card class="mb-8">
					<CardHeader>
						<CardTitle>Job Description</CardTitle>
					</CardHeader>
					<CardContent>
						<TiptapRenderer content={data.job.description} class="prose max-w-none" />
					</CardContent>
				</Card>
			{/if}

			<!-- Requirements -->
			{#if data.job.requirements}
				<Card class="mb-8">
					<CardHeader>
						<CardTitle>Requirements</CardTitle>
					</CardHeader>
					<CardContent>
						<TiptapRenderer content={data.job.requirements} class="prose max-w-none" />
					</CardContent>
				</Card>
			{/if}

			<!-- Benefits -->
			{#if data.job.benefits}
				<Card class="mb-8">
					<CardHeader>
						<CardTitle>Benefits</CardTitle>
					</CardHeader>
					<CardContent>
						<TiptapRenderer content={data.job.benefits} class="prose max-w-none" />
					</CardContent>
				</Card>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="lg:col-span-1">
			<!-- Company Info -->
			<Card class="sticky top-8 mb-6">
				<CardHeader>
					<CardTitle>About {data.job.organization.name}</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if data.job.organization.metadata?.description}
						<p class="text-sm text-muted-foreground">
							{data.job.organization.metadata.description}
						</p>
					{/if}

					<Button href="/companies/{data.job.organization.slug}" variant="outline" class="w-full">
						View Company Profile
					</Button>
				</CardContent>
			</Card>

			<!-- Similar Jobs -->
			{#if data.similarJobs.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>More from {data.job.organization.name}</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						{#each data.similarJobs as similarJob}
							<a
								href={generateJobUrl(similarJob, similarJob.organization)}
								class="block rounded-lg border p-3 transition-colors hover:bg-muted"
							>
								<p class="font-medium hover:text-primary">{similarJob.title}</p>
								<div class="mt-1 flex flex-wrap gap-2">
									<Badge variant="outline" class="text-xs">
										{formatLocationType(similarJob.locationType)}
									</Badge>
									<Badge variant="outline" class="text-xs">
										{formatJobType(similarJob.jobType)}
									</Badge>
								</div>
							</a>
						{/each}
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>
</div>

<!-- Application Modal -->
<Dialog bind:open={showApplicationModal}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Apply for {data.job.title}</DialogTitle>
			<DialogDescription>
				You'll be redirected to the external application page to complete your application.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			<div class="rounded-lg border bg-muted p-4">
				<div class="flex items-start gap-3">
					{#if data.job.organization.logo}
						<img
							src={data.job.organization.logo}
							alt={data.job.organization.name}
							class="h-12 w-12 rounded-lg object-cover"
						/>
					{:else}
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-background">
							<Building2 class="h-6 w-6 text-muted-foreground" />
						</div>
					{/if}

					<div>
						<p class="font-semibold">{data.job.title}</p>
						<p class="text-sm text-muted-foreground">{data.job.organization.name}</p>
					</div>
				</div>
			</div>

			<div class="space-y-2">
				<p class="text-sm text-muted-foreground">
					By clicking "Continue to Application", you'll be taken to:
				</p>
				<div class="rounded-lg bg-muted p-3">
					<p class="font-mono text-xs break-all">{data.job.applicationUrl}</p>
				</div>
			</div>

			<div class="flex gap-3">
				<Button variant="outline" onclick={() => (showApplicationModal = false)} class="flex-1">
					Cancel
				</Button>
				<Button
					onclick={() => {
						handleCtaClick();
						handleExternalOpen();
					}}
					class="flex-1 gap-2"
				>
					Continue to Application
					<ExternalLink class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>
