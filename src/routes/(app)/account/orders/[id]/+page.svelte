<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { Separator } from '$lib/components/ui/separator';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

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
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get status badge variant
	function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
		switch (status) {
			case 'paid':
			case 'succeeded':
				return 'default';
			case 'pending':
			case 'processing':
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

	// Get product name from productId
	function getProductName(productId: string): string {
		// Parse the productId to get a human-readable name
		if (productId === 'job_posting_base') {
			return 'Job Posting';
		}
		// Handle upsells
		return productId
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<Button href="/account/orders" variant="ghost" size="sm" class="mb-4">
			<ArrowLeftIcon class="mr-2 h-4 w-4" />
			Back to Orders
		</Button>
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Order #{data.order.id.slice(0, 8)}</h1>
				<p class="mt-2 text-muted-foreground">{formatDate(data.order.createdAt)}</p>
			</div>
			<Badge variant={getStatusVariant(data.order.status)} class="text-lg px-4 py-2">
				{getStatusText(data.order.status)}
			</Badge>
		</div>
	</div>

	<div class="grid gap-6">
		<!-- Order Items -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Order Items</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Product</Table.Head>
							<Table.Head class="text-center">Quantity</Table.Head>
							<Table.Head class="text-right">Amount</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.order.items as item}
							<Table.Row>
								<Table.Cell class="font-medium">{getProductName(item.productId)}</Table.Cell>
								<Table.Cell class="text-center">{item.quantity}</Table.Cell>
								<Table.Cell class="text-right">-</Table.Cell>
							</Table.Row>
						{/each}
						<Table.Row>
							<Table.Cell colspan={2} class="font-bold">Total</Table.Cell>
							<Table.Cell class="text-right font-bold">
								{formatAmount(data.order.totalAmount)}
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<!-- Payment Information -->
		{#if data.order.payments.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title>Payment Information</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each data.order.payments as payment}
							<div class="flex items-start justify-between border-b pb-4 last:border-b-0 last:pb-0">
								<div class="space-y-1">
									<p class="text-sm font-medium">
										Payment via {payment.provider.charAt(0).toUpperCase() + payment.provider.slice(1)}
									</p>
									<p class="text-sm text-muted-foreground">
										{formatDate(payment.createdAt)}
									</p>
									{#if payment.providerPaymentId}
										<p class="text-xs text-muted-foreground">
											ID: {payment.providerPaymentId}
										</p>
									{/if}
								</div>
								<div class="text-right">
									<p class="text-lg font-bold">{formatAmount(payment.amount)}</p>
									<Badge variant={getStatusVariant(payment.status)} class="mt-1">
										{getStatusText(payment.status)}
									</Badge>
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Order Details -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Order Details</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Order ID</span>
						<span class="font-mono">{data.order.id}</span>
					</div>
					<Separator />
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Currency</span>
						<span class="uppercase">{data.order.currency}</span>
					</div>
					<Separator />
					{#if data.order.provider}
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Payment Provider</span>
							<span>{data.order.provider.charAt(0).toUpperCase() + data.order.provider.slice(1)}</span>
						</div>
						<Separator />
					{/if}
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Created</span>
						<span>{formatDate(data.order.createdAt)}</span>
					</div>
					{#if data.order.completedAt}
						<Separator />
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Completed</span>
							<span>{formatDate(data.order.completedAt)}</span>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
