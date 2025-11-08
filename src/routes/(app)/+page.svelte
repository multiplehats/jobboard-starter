<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { formatRelativeTime, formatSalaryRange } from '$lib/utils/date';
	import { generateJobUrl } from '$lib/features/jobs/utils';
	import type { PageData } from './$types';
	import { Heart, MapPin, Briefcase, Building2 } from '@lucide/svelte';

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
	<title>JobBoard - Find Your Next Opportunity</title>
	<meta name="description" content="Connect talented professionals with amazing opportunities" />
</svelte:head>

<div class="flex flex-col">
	<!-- Hero Section -->
	<section class="border-b bg-gradient-to-b from-muted/50 to-background">
		<div class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
					Find Your Next Opportunity
				</h1>
				<p class="mt-6 text-lg leading-8 text-muted-foreground">
					Connect talented professionals with amazing opportunities. Whether you're looking for your
					next role or searching for the perfect candidate, we're here to help.
				</p>
				<div class="mt-10 flex items-center justify-center gap-4">
					{#if !data.user}
						<Button href="/signup" size="lg">Get Started</Button>
						<Button href="#jobs" variant="outline" size="lg">Browse Jobs</Button>
					{:else if data.userProfile?.state === 'talent'}
						<Button href="#jobs" size="lg">Browse Jobs</Button>
						<Button href="/dashboard/talent" variant="outline" size="lg">Go to Dashboard</Button>
					{:else if data.userProfile?.state === 'recruiter'}
						<Button href="/jobs/new" size="lg">Post a Job</Button>
						<Button href="/dashboard/recruiter" variant="outline" size="lg">Go to Dashboard</Button>
					{:else if data.userProfile?.state === 'both'}
						<Button href="/dashboard/talent" size="lg">Talent Dashboard</Button>
						<Button href="/dashboard/recruiter" variant="outline" size="lg">
							Recruiter Dashboard
						</Button>
					{:else}
						<Button href="/signup" size="lg">Complete Setup</Button>
						<Button href="#jobs" variant="outline" size="lg">Browse Jobs</Button>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Jobs Section -->
	<section id="jobs" class="py-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-8">
				<h2 class="text-3xl font-bold tracking-tight text-foreground">Latest Opportunities</h2>
				<p class="mt-2 text-muted-foreground">
					{data.jobs.length} job{data.jobs.length === 1 ? '' : 's'} available
				</p>
			</div>

			<!-- Filters -->
			<div class="mb-8 flex flex-wrap gap-4">
				<div class="flex flex-wrap gap-2">
					<span class="text-sm font-medium text-muted-foreground">Location:</span>
					<a
						href="/"
						class="text-sm {!data.filters.locationType
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						All
					</a>
					<span class="text-muted-foreground">•</span>
					<a
						href="?location_type=remote"
						class="text-sm {data.filters.locationType === 'remote'
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Remote
					</a>
					<span class="text-muted-foreground">•</span>
					<a
						href="?location_type=hybrid"
						class="text-sm {data.filters.locationType === 'hybrid'
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Hybrid
					</a>
					<span class="text-muted-foreground">•</span>
					<a
						href="?location_type=onsite"
						class="text-sm {data.filters.locationType === 'onsite'
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Onsite
					</a>
				</div>

				<div class="flex flex-wrap gap-2">
					<span class="text-sm font-medium text-muted-foreground">Type:</span>
					<a
						href="/"
						class="text-sm {!data.filters.jobType
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						All
					</a>
					<span class="text-muted-foreground">•</span>
					<a
						href="?job_type=full_time"
						class="text-sm {data.filters.jobType === 'full_time'
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Full-time
					</a>
					<span class="text-muted-foreground">•</span>
					<a
						href="?job_type=part_time"
						class="text-sm {data.filters.jobType === 'part_time'
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Part-time
					</a>
					<span class="text-muted-foreground">•</span>
					<a
						href="?job_type=contract"
						class="text-sm {data.filters.jobType === 'contract'
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Contract
					</a>
					<span class="text-muted-foreground">•</span>
					<a
						href="?job_type=freelance"
						class="text-sm {data.filters.jobType === 'freelance'
							? 'font-semibold text-primary'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Freelance
					</a>
				</div>
			</div>

			<!-- Job Grid -->
			{#if data.jobs.length === 0}
				<div class="py-12 text-center">
					<p class="text-muted-foreground">No jobs found. Try adjusting your filters.</p>
				</div>
			{:else}
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.jobs as job}
						{@const jobUrl = generateJobUrl(job, job.organization)}
						<a href={jobUrl} class="group block">
							<Card class="h-full transition-shadow hover:shadow-md">
								<CardHeader>
									<div class="mb-3 flex items-start justify-between gap-2">
										<div class="flex items-center gap-3">
											{#if job.organization.logo}
												<img
													src={job.organization.logo}
													alt={job.organization.name}
													class="h-12 w-12 rounded-lg object-cover"
												/>
											{:else}
												<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
													<Building2 class="h-6 w-6 text-muted-foreground" />
												</div>
											{/if}
											<div class="min-w-0 flex-1">
												<CardTitle class="line-clamp-2 text-base group-hover:text-primary">
													{job.title}
												</CardTitle>
												<p class="text-sm text-muted-foreground">{job.organization.name}</p>
											</div>
										</div>
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
	</section>

	<!-- Features Section -->
	<section class="border-t py-24">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					Why Choose JobBoard?
				</h2>
				<p class="mt-4 text-lg text-muted-foreground">
					Everything you need to find or fill your next role
				</p>
			</div>

			<div class="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				<div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
					<h3 class="text-lg font-semibold">For Talent</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						Create your profile, save jobs, track applications, and get discovered by top companies.
					</p>
				</div>

				<div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
					<h3 class="text-lg font-semibold">For Recruiters</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						Post jobs, manage applications, and find the perfect candidates for your team.
					</p>
				</div>

				<div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
					<h3 class="text-lg font-semibold">Simple & Effective</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						No complex processes. Just straightforward tools to connect talent with opportunities.
					</p>
				</div>
			</div>
		</div>
	</section>
</div>
