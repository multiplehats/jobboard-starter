import { z } from 'zod';

/**
 * Payment Validators
 * SHARED - Can be used on client AND server
 *
 * These Zod schemas provide runtime validation for payment-related data
 * and are used for both client-side form validation and server-side input validation.
 */

// ============================================================================
// Order Item Schema
// ============================================================================

/**
 * Schema for a single item in an order
 *
 * @example
 * ```ts
 * const item: OrderItem = {
 *   productId: 'job-posting-basic',
 *   quantity: 1,
 *   metadata: { jobId: 'abc123' }
 * };
 * ```
 */
export const orderItemSchema = z.object({
	/** Product ID from the products config */
	productId: z.string().min(1, 'Product ID is required'),
	/** Quantity of this product (defaults to 1) */
	quantity: z.number().int().positive().default(1),
	/** Additional metadata for this item (e.g., job ID, selected options) */
	metadata: z.record(z.unknown()).optional()
});

// ============================================================================
// Create Order Schema
// ============================================================================

/**
 * Schema for creating a new order
 *
 * @example
 * ```ts
 * const orderInput: CreateOrderInput = {
 *   items: [
 *     { productId: 'job-posting-basic', quantity: 1 }
 *   ],
 *   successUrl: 'https://example.com/success',
 *   cancelUrl: 'https://example.com/cancel'
 * };
 * ```
 */
export const createOrderSchema = z.object({
	/** Array of items to purchase (must have at least one) */
	items: z.array(orderItemSchema).min(1, 'At least one item is required'),
	/** URL to redirect to after successful payment */
	successUrl: z.string().url('Success URL must be a valid URL'),
	/** URL to redirect to if payment is canceled */
	cancelUrl: z.string().url('Cancel URL must be a valid URL')
});

// ============================================================================
// Checkout Params Schema
// ============================================================================

/**
 * Schema for checkout session parameters
 * Used when initiating a payment flow
 *
 * @example
 * ```ts
 * const params: CheckoutParams = {
 *   orderId: 'ord_123',
 *   provider: 'stripe' // optional, will use default if not specified
 * };
 * ```
 */
export const checkoutParamsSchema = z.object({
	/** Order ID to create checkout session for */
	orderId: z.string().min(1, 'Order ID is required'),
	/** Payment provider to use (optional, defaults to configured provider) */
	provider: z.string().optional()
});

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Inferred TypeScript type for an order item
 */
export type OrderItem = z.infer<typeof orderItemSchema>;

/**
 * Inferred TypeScript type for creating an order
 */
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Inferred TypeScript type for checkout parameters
 */
export type CheckoutParams = z.infer<typeof checkoutParamsSchema>;
