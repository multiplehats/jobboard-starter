<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import AppNav from '$lib/components/app-nav.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="min-h-screen bg-background">
	<AppNav user={data.user} userProfile={data.userProfile} />

	<main>
		{@render children()}
	</main>
</div>

<Toaster position="top-right" richColors />
