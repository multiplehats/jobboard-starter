<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/client/auth/auth-client';
	import { goto } from '$app/navigation';
	import type { UserProfile } from '$lib/features/users/types';

	let {
		user,
		userProfile
	}: {
		user: { id: string; name: string; email: string } | null;
		userProfile: UserProfile | null;
	} = $props();

	async function handleSignOut() {
		await authClient.signOut();
		goto('/');
	}

	// Helper to get navigation links based on user state
	function getNavLinks() {
		if (!user || !userProfile) {
			return [{ href: '/jobs', label: 'Browse Jobs' }];
		}

		const state = userProfile.state;

		if (state === 'talent') {
			return [
				{ href: '/jobs', label: 'Browse Jobs' },
				{ href: '/dashboard/talent', label: 'Dashboard' },
				{ href: '/saved-jobs', label: 'Saved Jobs' },
				{ href: '/applications', label: 'Applications' }
			];
		}

		if (state === 'recruiter') {
			return [
				{ href: '/jobs', label: 'Browse Jobs' },
				{ href: '/dashboard/recruiter', label: 'Dashboard' },
				{ href: '/jobs/new', label: 'Post Job' },
				{ href: '/jobs/manage', label: 'My Jobs' }
			];
		}

		if (state === 'both') {
			// Show combined navigation for users with both profiles
			// In the future, we could add a mode switcher here
			return [
				{ href: '/jobs', label: 'Browse Jobs' },
				{ href: '/dashboard/talent', label: 'Talent Dashboard' },
				{ href: '/dashboard/recruiter', label: 'Recruiter Dashboard' },
				{ href: '/saved-jobs', label: 'Saved Jobs' },
				{ href: '/jobs/new', label: 'Post Job' }
			];
		}

		// New user
		return [{ href: '/jobs', label: 'Browse Jobs' }];
	}

	const navLinks = $derived(getNavLinks());
</script>

<header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<nav class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
		<!-- Logo / Brand -->
		<div class="flex items-center">
			<a href="/" class="text-xl font-bold text-foreground">
				JobBoard
			</a>
		</div>

		<!-- Navigation Links -->
		<div class="hidden items-center gap-6 md:flex">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Auth Actions -->
		<div class="flex items-center gap-4">
			{#if !user}
				<Button variant="ghost" href="/login" class="text-sm">
					Log In
				</Button>
				<Button href="/signup" class="text-sm">
					Sign Up
				</Button>
			{:else}
				<div class="flex items-center gap-3">
					<!-- User info -->
					<div class="hidden items-center gap-2 sm:flex">
						<div class="text-right">
							<p class="text-sm font-medium">{user.name}</p>
							{#if userProfile}
								<p class="text-xs text-muted-foreground">
									{#if userProfile.state === 'talent'}
										Talent
									{:else if userProfile.state === 'recruiter'}
										Recruiter
									{:else if userProfile.state === 'both'}
										Talent & Recruiter
									{:else}
										New User
									{/if}
								</p>
							{/if}
						</div>
					</div>

					<Button variant="outline" onclick={handleSignOut} class="text-sm">
						Sign Out
					</Button>
				</div>
			{/if}
		</div>
	</nav>

	<!-- Mobile Navigation -->
	<div class="border-t px-4 py-3 md:hidden">
		<div class="flex flex-col gap-2">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>
</header>
