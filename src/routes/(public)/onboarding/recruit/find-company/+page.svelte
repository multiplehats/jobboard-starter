<script lang="ts">
	import { searchCompanies, createNewCompany } from '../onboard.remote';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Intro from '$lib/components/ui/intro';

	// Icons
	import SearchIcon from '@lucide/svelte/icons/search';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import PlusCircleIcon from '@lucide/svelte/icons/plus-circle';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	// State
	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);
	let isSearching = $state(false);
	let showCreateForm = $state(false);
	let selectedOrganization = $state<{ id: string; name: string } | null>(null);

	// Helper to safely get field issues
	function getIssues(field: any) {
		return field?.issues?.() ?? [];
	}

	// Search companies as user types (debounced)
	let searchTimeout: ReturnType<typeof setTimeout>;
	async function handleSearch() {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			isSearching = true;
			try {
				const result = await searchCompanies({ query: searchQuery }) as any;
				if (result.success) {
					searchResults = result.organizations || [];
				}
			} catch (error) {
				console.error('Search failed:', error);
			} finally {
				isSearching = false;
			}
		}, 300);
	}

	// Select an existing organization
	function selectOrganization(org: { id: string; name: string }) {
		selectedOrganization = org;
		// Navigate to step 2 with organization ID
		goto(`/onboarding/recruit/verify-email?orgId=${org.id}&orgName=${encodeURIComponent(org.name)}`);
	}

	// Handle successful company creation
	$effect(() => {
		if (createNewCompany.result && createNewCompany.result.success) {
			const org = createNewCompany.result.organization;
			if (org) {
				goto(`/onboarding/recruit/verify-email?orgId=${org.id}&orgName=${encodeURIComponent(org.name)}`);
			}
		}
	});
</script>

<Intro.Root>
	<Intro.Title>Find Your Company</Intro.Title>
	<Intro.Description>
		Search for your company to get started. If it doesn't exist, you can create it.
	</Intro.Description>
</Intro.Root>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Progress Indicator -->
	<div class="flex items-center justify-center gap-2">
		<Badge variant="default">Step 1 of 3</Badge>
	</div>

	<!-- Search Section -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<SearchIcon class="size-5" />
				Search for Your Company
			</Card.Title>
			<Card.Description>Start typing to find your company in our database</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<!-- Search Input -->
			<Field.Group>
				<Field.Field>
					<Field.Label for="search">Company Name</Field.Label>
					<div class="relative">
						<Input
							id="search"
							placeholder="e.g., ProductBird, Acme Inc."
							bind:value={searchQuery}
							oninput={handleSearch}
							class="pr-10"
						/>
						<SearchIcon class="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					</div>
				</Field.Field>
			</Field.Group>

			<!-- Search Results -->
			{#if isSearching}
				<div class="text-center py-8 text-muted-foreground">Searching...</div>
			{:else if searchQuery && searchResults.length > 0}
				<div class="space-y-2">
					<p class="text-sm font-medium">Found {searchResults.length} companies:</p>
					<div class="space-y-2">
						{#each searchResults as org (org.id)}
							<button
								onclick={() => selectOrganization(org)}
								class="w-full flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-accent"
							>
								<div class="flex items-center gap-3">
									{#if org.logo}
										<img src={org.logo} alt={org.name} class="size-10 rounded-lg" />
									{:else}
										<div class="flex size-10 items-center justify-center rounded-lg bg-muted">
											<BuildingIcon class="size-5 text-muted-foreground" />
										</div>
									{/if}
									<div>
										<p class="font-medium">{org.name}</p>
										<p class="text-sm text-muted-foreground">{org.slug}</p>
									</div>
								</div>
								<ArrowRightIcon class="size-5 text-muted-foreground" />
							</button>
						{/each}
					</div>
				</div>
			{:else if searchQuery && searchResults.length === 0}
				<div class="text-center py-8">
					<BuildingIcon class="mx-auto size-12 text-muted-foreground" />
					<p class="mt-2 text-sm font-medium">No companies found</p>
					<p class="text-sm text-muted-foreground">
						Try a different search or create your company
					</p>
				</div>
			{/if}

			<!-- Create Company Toggle -->
			{#if !showCreateForm}
				<div class="pt-4 border-t">
					<Button
						type="button"
						variant="outline"
						class="w-full"
						onclick={() => (showCreateForm = true)}
					>
						<PlusCircleIcon class="mr-2 size-4" />
						Can't find your company? Create it
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Create Company Form -->
	{#if showCreateForm}
		<Card.Root class="border-2 border-primary/20">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<BuildingIcon class="size-5" />
					Create Your Company
				</Card.Title>
				<Card.Description>Add your company to our database</Card.Description>
			</Card.Header>
			<Card.Content>
				<form {...createNewCompany} class="space-y-4">
					<Field.Group>
						<!-- Company Name -->
						<Field.Field data-invalid={getIssues(createNewCompany.fields.name).length > 0}>
							<Field.Label for="company-name">Company Name *</Field.Label>
							<Input
								id="company-name"
								placeholder="ProductBird"
								{...createNewCompany.fields.name.as('text')}
								aria-invalid={getIssues(createNewCompany.fields.name).length > 0}
							/>
							{#each getIssues(createNewCompany.fields.name) as issue, i (i)}
								<Field.Error>{issue.message}</Field.Error>
							{/each}
						</Field.Field>

						<!-- Company Website -->
						<Field.Field data-invalid={getIssues(createNewCompany.fields.website).length > 0}>
							<Field.Label for="company-website">Company Website *</Field.Label>
							<Input
								id="company-website"
								placeholder="https://productbird.ai"
								{...createNewCompany.fields.website.as('text')}
								type="url"
								aria-invalid={getIssues(createNewCompany.fields.website).length > 0}
							/>
							{#each getIssues(createNewCompany.fields.website) as issue, i (i)}
								<Field.Error>{issue.message}</Field.Error>
							{/each}
						</Field.Field>

						<!-- Company Logo (Optional) -->
						<Field.Field>
							<Field.Label for="company-logo">Company Logo URL (Optional)</Field.Label>
							<Input
								id="company-logo"
								placeholder="https://productbird.ai/logo.png"
								name="logo"
								type="url"
							/>
							<Field.Description>We'll try to fetch this automatically if left blank</Field.Description>
						</Field.Field>
					</Field.Group>

					<!-- Form Actions -->
					<div class="flex gap-3">
						<Button type="button" variant="outline" onclick={() => (showCreateForm = false)}>
							Cancel
						</Button>
						<Button type="submit" class="flex-1">
							Create Company & Continue
							<ArrowRightIcon class="ml-2 size-4" />
						</Button>
					</div>

					{#if createNewCompany.result && !createNewCompany.result.success}
						<p class="text-sm text-destructive">{createNewCompany.result.error}</p>
					{/if}
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
