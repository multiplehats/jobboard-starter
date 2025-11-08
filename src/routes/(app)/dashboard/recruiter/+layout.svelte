<script lang="ts">
	import { page } from '$app/stores';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import {
		LayoutDashboard,
		Briefcase,
		Plus,
		Building2,
		BarChart3,
		ChevronDown
	} from '@lucide/svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	// Get current route for active state
	const isActive = (path: string) => $page.url.pathname === path;

	// Current organization (first one for now, will add switcher later)
	let currentOrg = $derived(data.organizations[0]);
</script>

<Sidebar.Provider>
	<div class="flex min-h-screen w-full">
		<!-- Sidebar -->
		<Sidebar.Sidebar class="border-r">
			<Sidebar.Header class="border-b p-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-lg font-semibold">Recruiter Dashboard</h2>
						<p class="text-sm text-muted-foreground">{data.user?.name || 'User'}</p>
					</div>
				</div>

				{#if data.organizations.length > 1}
					<!-- Organization Switcher -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button variant="outline" class="mt-3 w-full justify-between">
								<div class="flex items-center gap-2">
									{#if currentOrg?.logo}
										<img src={currentOrg.logo} alt={currentOrg.name} class="h-5 w-5 rounded" />
									{:else}
										<Building2 class="h-5 w-5" />
									{/if}
									<span class="truncate">{currentOrg?.name ?? 'Select Organization'}</span>
								</div>
								<ChevronDown class="h-4 w-4 opacity-50" />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-56">
							{#each data.organizations as org}
								<DropdownMenu.Item>
									<div class="flex items-center gap-2">
										{#if org.logo}
											<img src={org.logo} alt={org.name} class="h-5 w-5 rounded" />
										{:else}
											<Building2 class="h-5 w-5" />
										{/if}
										<span>{org.name}</span>
									</div>
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else if currentOrg}
					<!-- Single Organization Display -->
					<div class="mt-3 flex items-center gap-2 rounded-lg border p-2">
						{#if currentOrg.logo}
							<img src={currentOrg.logo} alt={currentOrg.name} class="h-5 w-5 rounded" />
						{:else}
							<Building2 class="h-5 w-5" />
						{/if}
						<span class="truncate text-sm font-medium">{currentOrg.name}</span>
					</div>
				{/if}
			</Sidebar.Header>

			<Sidebar.Content class="p-4">
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<a
							href="/dashboard/recruiter"
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent {isActive(
								'/dashboard/recruiter'
							)
								? 'bg-accent font-medium'
								: ''}"
						>
							<LayoutDashboard class="h-5 w-5" />
							<span>Overview</span>
						</a>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<a
							href="/dashboard/recruiter/jobs"
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent {isActive(
								'/dashboard/recruiter/jobs'
							) || $page.url.pathname.startsWith('/dashboard/recruiter/jobs')
								? 'bg-accent font-medium'
								: ''}"
						>
							<Briefcase class="h-5 w-5" />
							<span>My Jobs</span>
						</a>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<a
							href="/dashboard/recruiter/jobs/new"
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent {isActive(
								'/dashboard/recruiter/jobs/new'
							)
								? 'bg-accent font-medium'
								: ''}"
						>
							<Plus class="h-5 w-5" />
							<span>Post New Job</span>
						</a>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<a
							href="/dashboard/recruiter/organizations"
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent {isActive(
								'/dashboard/recruiter/organizations'
							)
								? 'bg-accent font-medium'
								: ''}"
						>
							<Building2 class="h-5 w-5" />
							<span>Organizations</span>
						</a>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<a
							href="/dashboard/recruiter/analytics"
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent {isActive(
								'/dashboard/recruiter/analytics'
							)
								? 'bg-accent font-medium'
								: ''}"
						>
							<BarChart3 class="h-5 w-5" />
							<span>Analytics</span>
						</a>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.Content>
		</Sidebar.Sidebar>

		<!-- Main Content -->
		<div class="flex-1">
			<Sidebar.Trigger />
			<div class="container max-w-7xl py-8">
				{@render children()}
			</div>
		</div>
	</div>
</Sidebar.Provider>

<!-- Mobile Responsive Styles -->
<style>
	@media (max-width: 768px) {
		:global(.sidebar) {
			position: fixed;
			z-index: 50;
		}
	}
</style>
