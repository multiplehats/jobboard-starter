<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { AuthUIProvider } from 'better-auth-ui-svelte';
	import { authClient } from '$lib/client/auth/auth-client';

	let { children } = $props();
</script>

<AuthUIProvider {authClient}>
	{@render children()}
</AuthUIProvider>
