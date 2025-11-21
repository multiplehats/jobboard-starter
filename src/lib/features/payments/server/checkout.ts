import { paymentsRepository } from './repository';
import { updateOrderWithSession } from './mutations';
import { getPaymentSystem } from './system';
import { getProductsConfig } from '$lib/config/products';
import type { CheckoutParams } from '../validators';
import type { LineItem } from './adapters/adapter';
import type { Order } from '$lib/server/db/schema/payments';

/**
 * Checkout Service
 * DO NOT MODIFY - Core checkout session creation logic
 *
 * This service handles the creation of checkout sessions for payment providers.
 * It converts order items to provider line items and manages the checkout flow.
 */

/**
 * Parameters for creating a checkout session
 * Extends CheckoutParams with required redirect URLs
 */
export interface CreateCheckoutSessionParams extends CheckoutParams {
	/** URL to redirect to after successful payment */
	successUrl: string;
	/** URL to redirect to if payment is canceled */
	cancelUrl: string;
}

/**
 * Create checkout session
 *
 * This function:
 * 1. Retrieves the order from the database
 * 2. Converts order items to provider-specific line items
 * 3. Gets the appropriate payment adapter
 * 4. Creates a checkout session via the adapter
 * 5. Updates the order with the session ID
 *
 * @param params - Checkout parameters including orderId, URLs, and optional provider
 * @returns Checkout session with sessionId and redirect URL
 * @throws Error if order is not found
 * @throws Error if product price ID is not configured for the provider
 *
 * @example
 * ```typescript
 * const session = await createCheckoutSession({
 *   orderId: 'order_123',
 *   successUrl: 'https://example.com/success',
 *   cancelUrl: 'https://example.com/cancel',
 *   provider: 'stripe' // optional
 * });
 *
 * // Redirect user to checkout
 * redirect(303, session.url);
 * ```
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
	const config = getProductsConfig();
	const provider = params.provider || config.payment?.defaultProvider || 'stripe';

	// Get order via repository
	const order = await paymentsRepository.findOrderById(params.orderId);
	if (!order) {
		throw new Error(`Order not found: ${params.orderId}`);
	}

	// Convert order items to provider line items
	const lineItems = orderToLineItems(order, provider);

	// Get adapter via payment system
	const paymentSystem = getPaymentSystem();
	const adapter = paymentSystem.getAdapter(provider);

	// Create checkout session
	const session = await adapter.createCheckoutSession({
		lineItems,
		successUrl: params.successUrl,
		cancelUrl: params.cancelUrl,
		metadata: {
			orderId: order.id,
			userId: order.userId
		}
	});

	// Update order with session ID via mutation
	await updateOrderWithSession(order.id, provider, session.sessionId);

	return session;
}

/**
 * Convert order items to provider line items
 *
 * This function maps product IDs from the order to provider-specific price IDs.
 * It looks up the price configuration for each product and creates line items
 * that the payment provider can process.
 *
 * @param order - The order to convert
 * @param provider - The payment provider name (e.g., 'stripe')
 * @returns Array of line items with priceId and quantity
 * @throws Error if price ID is not configured for a product
 *
 * @example
 * ```typescript
 * const lineItems = orderToLineItems(order, 'stripe');
 * // Returns: [
 * //   { priceId: 'price_123', quantity: 1 },
 * //   { priceId: 'price_456', quantity: 2 }
 * // ]
 * ```
 */
function orderToLineItems(order: Order, provider: string): LineItem[] {
	const config = getProductsConfig();
	const lineItems: LineItem[] = [];

	for (const item of order.items) {
		let priceId: string | undefined;

		// Check if it's the base job posting
		if (item.productId === 'job_posting_base') {
			// Type assertion needed because TS doesn't know provider is a valid key
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			priceId = (config.jobPosting as any)[provider]?.priceId;
		} else {
			// Check upsells
			const upsell = config.upsells.find((u) => u.id === item.productId);
			if (upsell) {
				// Type assertion needed because TS doesn't know provider is a valid key
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				priceId = (upsell as any)[provider]?.priceId;
			}
		}

		if (!priceId) {
			throw new Error(
				`Price ID not configured for ${item.productId} on provider ${provider}. ` +
					`Please configure the ${provider} price ID in your products config.`
			);
		}

		lineItems.push({
			priceId,
			quantity: item.quantity
		});
	}

	return lineItems;
}
