<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Building2, Users, Briefcase, Plus, ExternalLink } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Organizations</h1>
			<p class="text-muted-foreground">Manage the organizations you're part of</p>
		</div>
		<Button href="/onboarding/recruit" variant="outline" class="gap-2">
			<Plus class="h-4 w-4" />
			Add Organization
		</Button>
	</div>

	<!-- Organizations Grid -->
	{#if data.organizationsWithDetails.length === 0}
		<!-- Empty State -->
		<Card>
			<CardContent class="flex flex-col items-center justify-center py-12">
				<Building2 class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="mb-2 text-lg font-semibold">No organizations yet</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					Get started by adding your first organization
				</p>
				<Button href="/onboarding/recruit" class="gap-2">
					<Plus class="h-4 w-4" />
					Add Your First Organization
				</Button>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.organizationsWithDetails as org}
				<Card class="transition-shadow hover:shadow-md">
					<CardHeader>
						<div class="flex items-start gap-4">
							{#if org.logo}
								<img
									src={org.logo}
									alt={org.name}
									class="h-16 w-16 rounded-lg border object-cover"
								/>
							{:else}
								<div
									class="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted"
								>
									<Building2 class="h-8 w-8 text-muted-foreground" />
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<CardTitle class="truncate">{org.name}</CardTitle>
								<CardDescription class="mt-1">
									<Badge variant="outline" class="capitalize">
										{org.role}
									</Badge>
								</CardDescription>
							</div>
						</div>
					</CardHeader>

					<CardContent class="space-y-4">
						<!-- Stats -->
						<div class="grid grid-cols-2 gap-4">
							<div class="flex items-center gap-2 text-sm">
								<Users class="h-4 w-4 text-muted-foreground" />
								<div>
									<div class="font-medium">{org.memberCount}</div>
									<div class="text-xs text-muted-foreground">
										Member{org.memberCount === 1 ? '' : 's'}
									</div>
								</div>
							</div>

							<div class="flex items-center gap-2 text-sm">
								<Briefcase class="h-4 w-4 text-muted-foreground" />
								<div>
									<div class="font-medium">{org.jobCount}</div>
									<div class="text-xs text-muted-foreground">
										Job{org.jobCount === 1 ? '' : 's'}
									</div>
								</div>
							</div>
						</div>

						<!-- Metadata (website if available) -->
						{#if org.metadata}
							{@const metadata = typeof org.metadata === 'string' ? JSON.parse(org.metadata) : org.metadata}
							{#if metadata.website}
								<div class="border-t pt-3">
									<a
										href={metadata.website}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										<ExternalLink class="h-3 w-3" />
										Visit Website
									</a>
								</div>
							{/if}
						{/if}

						<!-- Actions -->
						<div class="flex gap-2 border-t pt-3">
							<Button
								href="/dashboard/recruiter/jobs?org={org.id}"
								variant="outline"
								size="sm"
								class="flex-1"
							>
								View Jobs
							</Button>
							<Button
								href="/dashboard/recruiter/jobs/new?org={org.id}"
								size="sm"
								class="flex-1"
							>
								Post Job
							</Button>
						</div>

						<!-- Created Date -->
						<div class="text-xs text-muted-foreground">
							Joined {new Date(org.createdAt).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
