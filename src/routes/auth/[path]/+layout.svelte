<script lang="ts">
	import { authViewPaths } from 'better-auth-ui-svelte';
	import Logo from '$lib/components/logo.svelte';
	import type { LayoutProps } from './$types.js';

	let { children, params }: LayoutProps = $props();

	const isSplitLayout = $derived(
		[
			authViewPaths.SIGN_IN,
			authViewPaths.SIGN_UP,
			authViewPaths.FORGOT_PASSWORD,
			authViewPaths.RESET_PASSWORD,
			authViewPaths.MAGIC_LINK
		].includes(params.path ?? '')
	);
</script>

{#if isSplitLayout}
	<div class="grid max-h-screen min-h-svh lg:grid-cols-2">
		<div class="flex flex-col gap-4 p-6 md:p-10">
			<a href="/" class="flex justify-center gap-2 md:justify-start">
				<Logo class="h-6" href="/" />
			</a>
			<div class="flex flex-1 items-center justify-center">
				{@render children()}
			</div>
		</div>
		<div class="relative hidden bg-muted lg:block">
			<img
				src="/public/auth-screen.jpg"
				alt="park illustration"
				class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
			/>
		</div>
	</div>
{:else}
	{@render children()}
{/if}
