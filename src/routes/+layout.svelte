<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { AuthUIProvider } from 'better-auth-ui-svelte';
	import { authClient } from '$lib/client/auth/auth-client';
	import { getAuthLocalization } from '$lib/client/auth/auth-localization';
	import { toast, Toaster } from 'svelte-sonner';
	import { setSiteConfig, useSiteConfig } from '$lib/hooks/use-site-config.svelte';

	let { data, children } = $props();

	setSiteConfig(data.config);
	const config = useSiteConfig();

	const localization = getAuthLocalization(null, config);
</script>

{#if config.flags.darkMode}
	<ModeWatcher />
{/if}

<Toaster />

<AuthUIProvider {authClient} {localization} credentials={true} magicLink={true} {toast}>
	{@render children()}
</AuthUIProvider>
