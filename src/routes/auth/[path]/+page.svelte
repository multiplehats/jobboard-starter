<script lang="ts">
	import { page } from '$app/state';
	import { type AuthLocalization, AuthView } from 'better-auth-ui-svelte';
	import type { PageProps } from './$types.js';
	import type { UserState } from '$lib/features/users/types.js';
	import { siteConfig } from '$lib/shared/site-config.js';

	let { params }: PageProps = $props();

	const userType = $derived(page.url.searchParams.get('userType')) as UserState;
	const redirectTo = $derived(page.url.searchParams.get('callbackUrl') || '/app');

	const talentLocalization: Partial<AuthLocalization> = {
		SIGN_UP: 'Create a new account'
	};

	const recruiterLocalization: Partial<AuthLocalization> = {
		SIGN_UP: `Join hundreds of companies hiring on ${siteConfig.appName}`
	};
</script>

<AuthView
	localization={userType === 'talent' ? talentLocalization : recruiterLocalization}
	path={params.path}
	callbackURL={redirectTo}
	classNames={{
		base: 'border-none shadow-none bg-transparent',
		title: 'md:text-2xl font-semibold',
		description: 'md:text-base text-muted-foreground'
	}}
/>
