<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { data }: { data: PageData } = $props();

	// Format cents to dollars
	function formatAmount(cents: number): string {
		return `$${(cents / 100).toFixed(2)}`;
	}

	// Format date to readable format
	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Get status badge variant
	function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
		switch (status) {
			case 'paid':
				return 'default';
			case 'pending':
				return 'secondary';
			case 'failed':
			case 'canceled':
				return 'destructive';
			default:
				return 'secondary';
		}
	}

	// Get status display text
	function getStatusText(status: string): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Your Orders</h1>
		<p class="mt-2 text-muted-foreground">View your order history and details</p>
	</div>

	{#if data.orders.length === 0}
		<Card.Root>
			<Card.Content class="py-12 text-center">
				<p class="text-muted-foreground">You haven't placed any orders yet.</p>
				<Button href="/post-a-job" class="mt-4">Post a Job</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			{#each data.orders as order}
				<Card.Root>
					<Card.Header>
						<div class="flex items-start justify-between">
							<div class="space-y-1">
								<Card.Title class="text-lg">Order #{order.id.slice(0, 8)}</Card.Title>
								<Card.Description>{formatDate(order.createdAt)}</Card.Description>
							</div>
							<div class="text-right">
								<p class="text-2xl font-bold">{formatAmount(order.totalAmount)}</p>
								<Badge variant={getStatusVariant(order.status)} class="mt-1">
									{getStatusText(order.status)}
								</Badge>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="flex items-center justify-between">
							<div class="text-sm text-muted-foreground">
								{#if order.items.length === 1}
									1 item
								{:else}
									{order.items.length} items
								{/if}
							</div>
							<Button href="/account/orders/{order.id}" variant="outline" size="sm">
								View Details
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
