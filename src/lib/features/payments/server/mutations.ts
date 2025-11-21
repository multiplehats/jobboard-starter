import { paymentsRepository } from './repository';
import { getProductsConfig } from '$lib/config/products';
import { createBetterAuthId } from '$lib/server/db/schema/utils';
import type { OrderItem } from '../validators';
import type { Order, OrderMetadata } from '$lib/server/db/schema/payments';

/**
 * Payment Mutations
 * Write operations with business logic
 * Following backend-architecture.md pattern
 */

/**
 * Create a new order with validation and price calculation
 *
 * @param userId - The user ID creating the order
 * @param items - Array of order items with product IDs and quantities
 * @returns The created order
 * @throws Error if items array is empty or invalid
 *
 * @example
 * ```ts
 * const order = await createOrder('user_abc123', [
 *   { productId: 'job_posting_base', quantity: 1, metadata: { jobId: 'job_xyz' } },
 *   { productId: 'email_newsletter', quantity: 1 }
 * ]);
 * console.log(`Order created: ${order.id} - Total: $${order.totalAmount / 100}`);
 * ```
 */
export async function createOrder(userId: string, items: OrderItem[]): Promise<Order> {
	// Validate items
	if (items.length === 0) {
		throw new Error('Order must have at least one item');
	}

	const config = getProductsConfig();

	// Calculate total from products config
	let totalAmount = 0;
	for (const item of items) {
		const price = calculateItemPrice(item.productId);
		totalAmount += price * item.quantity;
	}

	// Validate total
	if (totalAmount < 0) {
		throw new Error('Invalid order total');
	}

	// Extract metadata (job IDs and upsells)
	const metadata = extractOrderMetadata(items);

	// Create order
	const order = await paymentsRepository.createOrder({
		id: createBetterAuthId('order'),
		userId,
		items,
		totalAmount,
		currency: config.jobPosting.currency,
		status: 'pending',
		metadata
	});

	return order;
}

/**
 * Update order with provider session information
 *
 * @param orderId - The order ID to update
 * @param provider - Payment provider name (e.g., 'stripe', 'dodopayments')
 * @param sessionId - Provider's checkout session ID
 * @returns The updated order or null if not found
 *
 * @example
 * ```ts
 * await updateOrderWithSession(
 *   'order_abc123',
 *   'stripe',
 *   'cs_test_123'
 * );
 * ```
 */
export async function updateOrderWithSession(
	orderId: string,
	provider: string,
	sessionId: string
) {
	return paymentsRepository.updateOrder(orderId, {
		provider,
		providerSessionId: sessionId
	});
}

/**
 * Mark order as paid with completion timestamp
 *
 * @param orderId - The order ID to mark as paid
 * @returns The updated order or null if not found
 *
 * @example
 * ```ts
 * await markOrderPaid('order_abc123');
 * ```
 */
export async function markOrderPaid(orderId: string) {
	return paymentsRepository.updateOrder(orderId, {
		status: 'paid',
		completedAt: new Date()
	});
}

/**
 * Mark order as failed
 *
 * @param orderId - The order ID to mark as failed
 * @returns The updated order or null if not found
 *
 * @example
 * ```ts
 * await markOrderFailed('order_abc123');
 * ```
 */
export async function markOrderFailed(orderId: string) {
	return paymentsRepository.updateOrder(orderId, {
		status: 'failed'
	});
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the price of a product from the products config
 *
 * @param productId - The product ID (e.g., 'job_posting_base', 'email_newsletter')
 * @returns Price in cents
 * @throws Error if product ID is not found in config
 *
 * @example
 * ```ts
 * const price = calculateItemPrice('job_posting_base');
 * console.log(`Price: $${price / 100}`);
 * ```
 */
export function calculateItemPrice(productId: string): number {
	const config = getProductsConfig();

	// Check if it's the base job posting
	if (productId === 'job_posting_base') {
		return config.jobPosting.price;
	}

	// Check if it's an upsell
	const upsell = config.upsells.find((u) => u.id === productId);
	if (upsell) {
		return upsell.price;
	}

	throw new Error(`Unknown product: ${productId}`);
}

/**
 * Extract metadata from order items
 * Collects job IDs and upsells for storage in order metadata
 *
 * @param items - Array of order items
 * @returns OrderMetadata object with jobIds and upsells arrays
 *
 * @example
 * ```ts
 * const metadata = extractOrderMetadata([
 *   { productId: 'job_posting_base', quantity: 1, metadata: { jobId: 'job_123' } },
 *   { productId: 'email_newsletter', quantity: 1 }
 * ]);
 * // Returns: { jobIds: ['job_123'], upsells: ['email_newsletter'] }
 * ```
 */
export function extractOrderMetadata(items: OrderItem[]): OrderMetadata {
	const jobIds: string[] = [];
	const upsells: string[] = [];

	for (const item of items) {
		// Extract job ID if present
		if (item.metadata?.jobId && typeof item.metadata.jobId === 'string') {
			jobIds.push(item.metadata.jobId);
		}

		// Collect upsells (anything that's not the base job posting)
		if (item.productId !== 'job_posting_base') {
			upsells.push(item.productId);
		}
	}

	return {
		jobIds: jobIds.length > 0 ? jobIds : undefined,
		upsells: upsells.length > 0 ? upsells : undefined
	};
}
