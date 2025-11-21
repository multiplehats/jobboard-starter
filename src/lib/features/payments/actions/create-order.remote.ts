import { form, getRequestEvent } from '$app/server';
import { createOrderSchema, type CreateOrderInput } from '../validators';
import { createOrder } from '../server/mutations';
import { createCheckoutSession } from '../server/checkout';

/**
 * Payment Remote Functions
 * Type-safe mutations callable from components
 * Following backend-architecture.md pattern
 */

/**
 * Create order and checkout session
 * Used by job posting form and other payment flows
 *
 * This remote function:
 * 1. Validates the authenticated user session
 * 2. Creates a new order with the provided items
 * 3. Creates a checkout session for the order
 * 4. Returns the order ID, checkout URL, and session ID
 *
 * @param data - Order creation data with items, successUrl, and cancelUrl
 * @param data.items - Array of order items with productId, quantity, and optional metadata
 * @param data.successUrl - URL to redirect to after successful payment
 * @param data.cancelUrl - URL to redirect to if payment is canceled
 * @returns Object containing orderId, checkoutUrl, and sessionId
 * @throws Error if user is not authenticated
 * @throws Error if order creation fails
 * @throws Error if checkout session creation fails
 *
 * @example
 * ```typescript
 * // In a Svelte component
 * import { createOrderRemote } from '$lib/features/payments/actions/create-order.remote';
 *
 * async function handleCheckout() {
 *   const result = await createOrderRemote({
 *     items: [
 *       { productId: 'job_posting_base', quantity: 1, metadata: { jobId: 'job_123' } },
 *       { productId: 'email_newsletter', quantity: 1 }
 *     ],
 *     successUrl: 'https://example.com/success',
 *     cancelUrl: 'https://example.com/cancel'
 *   });
 *
 *   // Redirect to checkout
 *   window.location.href = result.checkoutUrl;
 * }
 * ```
 */
export const createOrderRemote = form('unchecked', async (data, invalid) => {
	// Validate data with Zod schema
	const parseResult = createOrderSchema.safeParse(data);
	if (!parseResult.success) {
		return invalid(parseResult.error.message);
	}

	const validatedData = parseResult.data;

	// Get request event to access auth session
	const event = getRequestEvent();

	// Validate authenticated user
	const session = await event.locals.auth();
	if (!session?.user) {
		throw new Error('Unauthorized: You must be logged in to create an order');
	}

	// Create order with validated items
	const order = await createOrder(session.user.id, validatedData.items);

	// Create checkout session with redirect URLs
	const checkout = await createCheckoutSession({
		orderId: order.id,
		successUrl: validatedData.successUrl,
		cancelUrl: validatedData.cancelUrl
	});

	// Return type-safe response
	return {
		orderId: order.id,
		checkoutUrl: checkout.url,
		sessionId: checkout.sessionId
	};
});

/**
 * Type for the return value of createOrderRemote
 * Exported for use in components
 */
export type CreateOrderRemoteResult = {
	orderId: string;
	checkoutUrl: string;
	sessionId: string;
};
