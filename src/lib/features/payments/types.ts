/**
 * Payment System Types
 * SHARED - Can be used on client AND server
 *
 * NOTE: Once src/lib/server/db/schema/payments.ts is created, this file will
 * re-export Order and Payment types from there. For now, we define placeholder
 * types that match the planned schema structure.
 */

// Re-export OrderItem from validators to avoid circular dependency
export type { OrderItem } from './validators';

// TODO: Replace with actual imports once schema is created
// import type { Order, Payment } from '$lib/server/db/schema/payments';
// export type { Order, Payment };

// Temporary type definitions matching planned schema
// These will be replaced with re-exports from schema once it exists
export interface Order {
	id: string;
	userId: string;
	items: import('./validators').OrderItem[];
	totalAmount: number;
	currency: string;
	status: OrderStatus;
	provider: string | null;
	providerSessionId: string | null;
	metadata: OrderMetadata | null;
	createdAt: Date;
	updatedAt: Date;
	completedAt: Date | null;
}

export interface Payment {
	id: string;
	orderId: string;
	provider: string;
	providerPaymentId: string;
	providerCustomerId: string | null;
	amount: number;
	currency: string;
	status: PaymentStatus;
	metadata: Record<string, unknown> | null;
	createdAt: Date;
	updatedAt: Date;
	completedAt: Date | null;
}

// ============================================================================
// Order/Payment Status Types
// ============================================================================

/**
 * Order status represents the overall state of the purchase
 */
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled';

/**
 * Payment status represents the transaction state with the payment provider
 */
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

// ============================================================================
// Order Metadata
// ============================================================================

/**
 * Extensible metadata stored with each order
 * Used to track job-specific data and selected upsells
 */
export interface OrderMetadata {
	/** Job IDs associated with this order */
	jobIds?: string[];
	/** Selected upsell IDs from pricing config */
	upsells?: string[];
	/** Extensible for future product types */
	[key: string]: unknown;
}

// ============================================================================
// Checkout Types
// ============================================================================

/**
 * Response from creating a checkout session
 * Contains the session ID and redirect URL for the payment provider
 */
export interface CheckoutSession {
	/** Payment provider session ID */
	sessionId: string;
	/** URL to redirect user to complete payment */
	url: string;
}

// ============================================================================
// Webhook Types (Server-only but defined here)
// ============================================================================

/**
 * Normalized webhook event structure
 * Used internally to process events from different payment providers
 */
export interface WebhookEvent {
	/** Unique event ID from the provider */
	id: string;
	/** Event type (e.g., 'checkout.session.completed') */
	type: string;
	/** Payment provider name (e.g., 'stripe', 'dodopayments') */
	provider: string;
	/** Raw event data from the provider */
	data: unknown;
	/** Additional metadata */
	metadata?: Record<string, string>;
}

// ============================================================================
// Payment Context (for event handlers)
// ============================================================================

/**
 * Context passed to payment lifecycle hooks
 * Provides all necessary data for handling payment events
 */
export interface PaymentContext {
	/** The webhook event that triggered this handler */
	event: WebhookEvent;
	/** The order being processed */
	order: Order;
	/** The payment transaction */
	payment: Payment;
	/** Payment provider name */
	provider: string;
}

// ============================================================================
// Handler Types
// ============================================================================

/**
 * Payment lifecycle hook handler function
 * Executes custom logic when payment events occur
 *
 * @param ctx - Payment context with event, order, and payment data
 * @returns Promise that resolves when handler completes
 */
export type PaymentHandler = (ctx: PaymentContext) => Promise<void>;
