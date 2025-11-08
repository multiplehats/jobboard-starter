<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { formatRelativeTime, formatSalaryRange } from '$lib/utils/date';
	import { generateJobUrl } from '$lib/features/jobs/utils';
	import type { PageData } from './$types';
	import { Building2, MapPin, Briefcase, Heart } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

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
</script>

<svelte:head>
	<title>{data.seo?.title || data.organization.name}</title>
	{#if data.seo?.description}
		<meta name="description" content={data.seo.description} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Company Header -->
	<div class="mb-12 rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
		<div class="flex flex-col gap-6 sm:flex-row sm:items-start">
			{#if data.organization.logo}
				<img
					src={data.organization.logo}
					alt={data.organization.name}
					class="h-24 w-24 rounded-lg object-cover"
				/>
			{:else}
				<div class="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
					<Building2 class="h-12 w-12 text-muted-foreground" />
				</div>
			{/if}

			<div class="flex-1">
				<h1 class="text-3xl font-bold tracking-tight">{data.organization.name}</h1>

				{#if data.organization.metadata?.description}
					<p class="mt-2 text-muted-foreground">
						{data.organization.metadata.description}
					</p>
				{/if}

				<div class="mt-4 flex flex-wrap gap-4">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<Briefcase class="h-4 w-4" />
						<span>{data.jobs.length} open position{data.jobs.length === 1 ? '' : 's'}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- About Section -->
	{#if data.organization.metadata?.about}
		<div class="mb-12">
			<h2 class="mb-4 text-2xl font-bold tracking-tight">About the Company</h2>
			<div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
				<p class="whitespace-pre-wrap text-muted-foreground">
					{data.organization.metadata.about}
				</p>
			</div>
		</div>
	{/if}

	<!-- Open Positions -->
	<div>
		<h2 class="mb-6 text-2xl font-bold tracking-tight">Open Positions</h2>

		{#if data.jobs.length === 0}
			<div class="rounded-lg border bg-card p-12 text-center text-card-foreground shadow-sm">
				<p class="text-muted-foreground">No open positions at the moment.</p>
				<p class="mt-2 text-sm text-muted-foreground">Check back later for new opportunities!</p>
			</div>
		{:else}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.jobs as job}
					{@const jobUrl = generateJobUrl(job, job.organization)}
					<a href={jobUrl} class="group block">
						<Card class="h-full transition-shadow hover:shadow-md">
							<CardHeader>
								<div class="flex items-start justify-between gap-2">
									<CardTitle class="line-clamp-2 text-base group-hover:text-primary">
										{job.title}
									</CardTitle>
									{#if data.userProfile?.state === 'talent' || data.userProfile?.state === 'both'}
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8 shrink-0"
											onclick={(e) => {
												e.preventDefault();
												// TODO: Implement save functionality
											}}
										>
											<Heart class="h-4 w-4" />
										</Button>
									{/if}
								</div>
							</CardHeader>
							<CardContent class="space-y-3">
								<div class="flex flex-wrap gap-2">
									<Badge variant={getLocationTypeVariant(job.locationType)}>
										<MapPin class="mr-1 h-3 w-3" />
										{formatLocationType(job.locationType)}
									</Badge>
									<Badge variant="outline">
										<Briefcase class="mr-1 h-3 w-3" />
										{formatJobType(job.jobType)}
									</Badge>
								</div>

								{#if job.location}
									<p class="text-sm text-muted-foreground">{job.location}</p>
								{/if}

								{#if job.salaryMin || job.salaryMax}
									{@const salary = formatSalaryRange(
										job.salaryMin,
										job.salaryMax,
										job.salaryCurrency,
										job.salaryPeriod
									)}
									{#if salary}
										<p class="text-sm font-semibold text-foreground">{salary}</p>
									{/if}
								{/if}

								{#if job.publishedAt}
									<p class="text-xs text-muted-foreground">
										{formatRelativeTime(job.publishedAt)}
									</p>
								{/if}
							</CardContent>
						</Card>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
