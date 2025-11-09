<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { AuthView } from 'better-auth-ui-svelte';
	import type { PageProps } from './$types.js';
	import type { UserState } from '$lib/features/users/types.js';
	import { getAuthLocalization } from '$lib/client/auth/auth-localization.js';
	import { authRoutes } from '$lib/utils/navigation.js';
	import GetStartedRadioGroup from '$lib/components/auth/get-started-radio-group.svelte';
	import { useSiteConfig } from '$lib/hooks/use-site-config.svelte';

	let { params }: PageProps = $props();

	const config = useSiteConfig();
	const userTypeParam = $derived(page.url.searchParams.get('userType')) as UserState;
	const redirectTo = $derived(page.url.searchParams.get('callbackUrl') || '/app');
	const localization = $derived(getAuthLocalization(userTypeParam, config));

	let userType = $state<'talent' | 'recruit'>('talent');

	function handleContinue() {
		const path =
			userType === 'talent'
				? authRoutes.signUp({
						userType: 'talent',
						callbackUrl: '/onboarding/talent'
					})
				: authRoutes.signUp({
						userType: 'recruiter',
						callbackUrl: '/onboarding/recruit'
					});
		goto(path);
	}
</script>

{#if params.path === 'get-started'}
	<GetStartedRadioGroup />
{:else}
	<AuthView
		{localization}
		path={page.params.path}
		callbackURL={redirectTo}
		classNames={{
			base: 'border-none shadow-none bg-transparent',
			title: 'md:text-2xl font-semibold',
			description: 'md:text-base text-muted-foreground'
		}}
	/>
{/if}
