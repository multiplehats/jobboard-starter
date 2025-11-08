<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);
	let isSearching = $state(false);
	let showCreateForm = $state(false);
	let selectedOrgId = $state<string | null>(null);

	let newCompanyName = $state('');
	let newCompanyWebsite = $state('');
	let isCreating = $state(false);

	async function handleSearch() {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}

		isSearching = true;
		try {
			const response = await fetch(`/api/organizations/search?q=${encodeURIComponent(searchQuery)}`);
			const data = await response.json();
			searchResults = data.organizations || [];
		} catch (error) {
			console.error('Search error:', error);
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	function selectOrganization(orgId: string) {
		selectedOrgId = orgId;
		// Store in sessionStorage for next step
		sessionStorage.setItem('selectedOrgId', orgId);
		goto('/onboarding/recruit/verify-email');
	}

	function toggleCreateForm() {
		showCreateForm = !showCreateForm;
		if (showCreateForm) {
			searchResults = [];
			searchQuery = '';
		}
	}

	let searchTimeout: NodeJS.Timeout;
	$effect(() => {
		clearTimeout(searchTimeout);
		if (searchQuery.trim()) {
			searchTimeout = setTimeout(handleSearch, 300);
		} else {
			searchResults = [];
		}
	});
</script>

<div class="container mx-auto max-w-2xl py-8 px-4">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Find your company</h1>
		<p class="text-muted-foreground">
			Search for your organization or create a new one.
		</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Search for your company</CardTitle>
			<CardDescription>
				Start typing to find your organization
			</CardDescription>
		</CardHeader>

		<CardContent class="space-y-6">
			<!-- Search box -->
			<div class="space-y-2">
				<Label for="search">Company name</Label>
				<Input
					id="search"
					type="text"
					placeholder="e.g., Acme Inc, TechCorp..."
					bind:value={searchQuery}
					disabled={showCreateForm}
				/>
			</div>

			<!-- Search results -->
			{#if searchResults.length > 0}
				<div class="space-y-2">
					<p class="text-sm text-muted-foreground">Select your company:</p>
					<div class="space-y-2">
						{#each searchResults as org}
							<button
								type="button"
								onclick={() => selectOrganization(org.id)}
								class="w-full p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors text-left"
							>
								<div class="flex items-center gap-4">
									{#if org.logo}
										<img src={org.logo} alt={org.name} class="h-10 w-10 rounded" />
									{:else}
										<div class="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
											<span class="text-lg font-semibold text-primary">
												{org.name.charAt(0).toUpperCase()}
											</span>
										</div>
									{/if}
									<div>
										<p class="font-semibold">{org.name}</p>
										{#if org.metadata}
											{@const metadata = typeof org.metadata === 'string' ? JSON.parse(org.metadata) : org.metadata}
											{#if metadata.website}
												<p class="text-sm text-muted-foreground">{metadata.website}</p>
											{/if}
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{:else if searchQuery && !isSearching && !showCreateForm}
				<div class="text-center py-6 text-muted-foreground">
					<p>No companies found matching "{searchQuery}"</p>
				</div>
			{/if}

			<!-- Loading state -->
			{#if isSearching}
				<div class="text-center py-6 text-muted-foreground">
					<p>Searching...</p>
				</div>
			{/if}

			<!-- Separator -->
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<Separator />
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-background px-2 text-muted-foreground">
						{showCreateForm ? 'Or search instead' : "Can't find your company?"}
					</span>
				</div>
			</div>

			<!-- Create new company form -->
			{#if !showCreateForm}
				<Button variant="outline" onclick={toggleCreateForm} class="w-full">
					Create a new company
				</Button>
			{:else}
				<div class="space-y-4">
					<div>
						<h3 class="font-semibold mb-4">Create a new company</h3>

						<form method="POST" action="?/createCompany" use:enhance={() => {
							isCreating = true;
							return async ({ result }) => {
								isCreating = false;
								if (result.type === 'success' && result.data?.organizationId) {
									sessionStorage.setItem('selectedOrgId', result.data.organizationId as string);
									sessionStorage.setItem('isNewOrg', 'true');
									goto('/onboarding/recruit/verify-email');
								}
							};
						}} class="space-y-4">
							<div class="space-y-2">
								<Label for="companyName">Company name *</Label>
								<Input
									id="companyName"
									name="companyName"
									type="text"
									placeholder="Acme Inc"
									bind:value={newCompanyName}
									required
								/>
							</div>

							<div class="space-y-2">
								<Label for="companyWebsite">Company website (optional)</Label>
								<Input
									id="companyWebsite"
									name="companyWebsite"
									type="url"
									placeholder="https://acme.com"
									bind:value={newCompanyWebsite}
								/>
							</div>

							{#if form?.error}
								<div class="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
									{form.error}
								</div>
							{/if}

							<div class="flex gap-2">
								<Button type="submit" disabled={isCreating || !newCompanyName.trim()}>
									{isCreating ? 'Creating...' : 'Create company'}
								</Button>
								<Button type="button" variant="ghost" onclick={toggleCreateForm}>
									Cancel
								</Button>
							</div>
						</form>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Back option -->
	<div class="text-center mt-6">
		<a href="/dashboard" class="text-sm text-muted-foreground hover:text-foreground underline">
			Go to dashboard
		</a>
	</div>
</div>
