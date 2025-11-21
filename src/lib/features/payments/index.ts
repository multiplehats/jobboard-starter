/**
 * Payments Feature - Public API
 *
 * This barrel export provides a clean public API for the payments feature.
 * Only client-safe code is exported here (types, validators, and remote functions).
 *
 * Server-side code (repository, mutations, queries, webhooks, etc.) should be
 * imported directly where needed and is NOT exposed through this public API.
 *
 * @example
 * ```ts
 * // Client-side usage
 * import { createOrderRemote, type CreateOrderInput } from '$lib/features/payments';
 *
 * const result = await createOrderRemote({
 *   items: [{ productId: 'job-posting-basic', quantity: 1 }],
 *   successUrl: '/success',
 *   cancelUrl: '/cancel'
 * });
 * ```
 */

// ============================================================================
// Types - Client-safe type definitions
// ============================================================================

export type {
	// Order & Payment types
	Order,
	Payment,
	OrderStatus,
	PaymentStatus,
	OrderMetadata,
	// Checkout types
	CheckoutSession,
	// Webhook types (useful for type checking even on client)
	WebhookEvent,
	PaymentContext,
	// Handler types
	PaymentHandler
} from './types';

// ============================================================================
// Validators - Zod schemas for runtime validation
// ============================================================================

export {
	// Schemas
	orderItemSchema,
	createOrderSchema,
	checkoutParamsSchema
} from './validators';

export type {
	// Inferred types from schemas
	OrderItem,
	CreateOrderInput,
	CheckoutParams
} from './validators';

// ============================================================================
// Actions - Remote functions callable from client
// ============================================================================

export { createOrderRemote } from './actions';
export type { CreateOrderRemoteResult } from './actions';
