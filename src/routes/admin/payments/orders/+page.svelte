<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import SearchIcon from '@lucide/svelte/icons/search';

	let { data }: { data: PageData } = $props();

	// Filter state
	let searchQuery = $state('');
	let statusFilter = $state<string>('all');

	// Format cents to dollars
	function formatAmount(cents: number): string {
		return `$${(cents / 100).toFixed(2)}`;
	}

	// Format date to readable format
	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
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

	// Filter orders based on search and status
	const filteredOrders = $derived(() => {
		let filtered = data.orders;

		// Filter by status
		if (statusFilter !== 'all') {
			filtered = filtered.filter((order) => order.status === statusFilter);
		}

		// Filter by search query (order ID or user ID)
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(order) =>
					order.id.toLowerCase().includes(query) || order.userId.toLowerCase().includes(query)
			);
		}

		return filtered;
	});

	// Calculate statistics
	const stats = $derived(() => {
		const total = data.orders.length;
		const paid = data.orders.filter((o) => o.status === 'paid').length;
		const pending = data.orders.filter((o) => o.status === 'pending').length;
		const failed = data.orders.filter((o) => o.status === 'failed').length;
		const totalRevenue = data.orders
			.filter((o) => o.status === 'paid')
			.reduce((sum, o) => sum + o.totalAmount, 0);

		return { total, paid, pending, failed, totalRevenue };
	});
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Orders Management</h1>
		<p class="mt-2 text-muted-foreground">View and manage all customer orders</p>
	</div>

	<!-- Statistics Cards -->
	<div class="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Total Orders</Card.Description>
				<Card.Title class="text-2xl">{stats().total}</Card.Title>
			</Card.Header>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Paid</Card.Description>
				<Card.Title class="text-2xl text-green-600">{stats().paid}</Card.Title>
			</Card.Header>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Pending</Card.Description>
				<Card.Title class="text-2xl text-yellow-600">{stats().pending}</Card.Title>
			</Card.Header>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Failed</Card.Description>
				<Card.Title class="text-2xl text-red-600">{stats().failed}</Card.Title>
			</Card.Header>
		</Card.Root>
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Description>Total Revenue</Card.Description>
				<Card.Title class="text-2xl">{formatAmount(stats().totalRevenue)}</Card.Title>
			</Card.Header>
		</Card.Root>
	</div>

	<!-- Filters -->
	<Card.Root class="mb-6">
		<Card.Content class="pt-6">
			<div class="flex flex-col gap-4 md:flex-row md:items-center">
				<div class="relative flex-1">
					<SearchIcon
						class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						placeholder="Search by order ID or user ID..."
						bind:value={searchQuery}
						class="pl-9"
					/>
				</div>
				<div class="flex gap-2">
					<Button
						variant={statusFilter === 'all' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (statusFilter = 'all')}
					>
						All
					</Button>
					<Button
						variant={statusFilter === 'paid' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (statusFilter = 'paid')}
					>
						Paid
					</Button>
					<Button
						variant={statusFilter === 'pending' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (statusFilter = 'pending')}
					>
						Pending
					</Button>
					<Button
						variant={statusFilter === 'failed' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (statusFilter = 'failed')}
					>
						Failed
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Orders Table -->
	<Card.Root>
		<Card.Content class="p-0">
			{#if filteredOrders().length === 0}
				<div class="py-12 text-center text-muted-foreground">
					{#if searchQuery || statusFilter !== 'all'}
						No orders found matching your filters.
					{:else}
						No orders yet.
					{/if}
				</div>
			{:else}
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Order ID</Table.Head>
								<Table.Head>User ID</Table.Head>
								<Table.Head>Amount</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head>Provider</Table.Head>
								<Table.Head>Date</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each filteredOrders() as order}
								<Table.Row>
									<Table.Cell class="font-mono text-sm">
										{order.id.slice(0, 12)}...
									</Table.Cell>
									<Table.Cell class="font-mono text-sm">
										{order.userId.slice(0, 12)}...
									</Table.Cell>
									<Table.Cell class="font-semibold">
										{formatAmount(order.totalAmount)}
									</Table.Cell>
									<Table.Cell>
										<Badge variant={getStatusVariant(order.status)}>
											{getStatusText(order.status)}
										</Badge>
									</Table.Cell>
									<Table.Cell>
										{order.provider
											? order.provider.charAt(0).toUpperCase() + order.provider.slice(1)
											: '-'}
									</Table.Cell>
									<Table.Cell class="text-sm">{formatDate(order.createdAt)}</Table.Cell>
									<Table.Cell class="text-right">
										<Button href="/account/orders/{order.id}" variant="ghost" size="sm">
											View Details
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
