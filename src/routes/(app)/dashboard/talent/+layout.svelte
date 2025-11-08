<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import { cn } from '$lib/utils';
	import { LayoutDashboard, Bookmark, FileText, User, Menu } from '@lucide/svelte';

	interface Props {
		children: import('svelte').Snippet;
		data: {
			talentProfile: any;
		};
	}

	let { children, data }: Props = $props();

	const navItems = [
		{
			href: '/dashboard/talent',
			label: 'Overview',
			icon: LayoutDashboard
		},
		{
			href: '/dashboard/talent/saved',
			label: 'Saved Jobs',
			icon: Bookmark
		},
		{
			href: '/dashboard/talent/applications',
			label: 'Applications',
			icon: FileText
		},
		{
			href: '/dashboard/talent/profile',
			label: 'Profile Settings',
			icon: User
		}
	];

	let mobileMenuOpen = $state(false);

	function isActive(href: string): boolean {
		if (href === '/dashboard/talent') {
			return $page.url.pathname === href;
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="flex min-h-screen">
	<!-- Desktop Sidebar -->
	<aside class="hidden w-64 border-r bg-muted/40 md:block">
		<div class="flex h-full flex-col">
			<div class="flex h-16 items-center border-b px-6">
				<h2 class="text-lg font-semibold">Talent Dashboard</h2>
			</div>
			<nav class="flex-1 space-y-1 p-4">
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						class={cn(
							'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
							isActive(item.href)
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
						)}
					>
						<item.icon class="h-5 w-5" />
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	</aside>

	<!-- Mobile Header -->
	<div class="flex flex-1 flex-col">
		<header class="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 md:hidden">
			<Sheet bind:open={mobileMenuOpen}>
				<SheetTrigger>
					<Button variant="ghost" size="icon">
						<Menu class="h-6 w-6" />
						<span class="sr-only">Toggle menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" class="w-64 p-0">
					<div class="flex h-16 items-center border-b px-6">
						<h2 class="text-lg font-semibold">Talent Dashboard</h2>
					</div>
					<nav class="space-y-1 p-4">
						{#each navItems as item (item.href)}
							<a
								href={item.href}
								onclick={() => (mobileMenuOpen = false)}
								class={cn(
									'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
									isActive(item.href)
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
								)}
							>
								<item.icon class="h-5 w-5" />
								{item.label}
							</a>
						{/each}
					</nav>
				</SheetContent>
			</Sheet>
			<h1 class="ml-4 text-lg font-semibold">Talent Dashboard</h1>
		</header>

		<!-- Main Content -->
		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</div>
</div>
