<script lang="ts">
	import { page } from '$app/state';
	import Footer from '$lib/components/public/footer.svelte';
	import Header from '$lib/components/public/header.svelte';
	import { Container } from '$lib/components/ui/container';
	import { Wrapper } from '$lib/components/ui/wrapper/index.js';
	import { isRouteActive } from '$lib/utils/navigation';
	import { cn } from '$lib/utils/ui';

	let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col overflow-clip">
	<Header variant={isRouteActive(page, '/post-a-job') ? 'minimal' : undefined} />

	<main>
		<Container>
			{#snippet child({ props })}
				<Wrapper class={cn('grow py-fluid-md', props.class)}>
					{@render children?.()}
				</Wrapper>
			{/snippet}
		</Container>
	</main>

	<Footer />
</div>
