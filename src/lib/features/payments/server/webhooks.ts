/**
 * Webhook Processing System
 * Handles webhook events from payment providers
 *
 * Architecture:
 * 1. Verify webhook signature via adapter
 * 2. Parse webhook event via adapter
 * 3. Normalize event types across providers
 * 4. Route to appropriate handler
 * 5. Check for duplicate processing (idempotency)
 * 6. Update database via repository
 * 7. Emit events to payment system for custom handlers
 *
 * Following backend-architecture.md patterns
 */

import { paymentsRepository } from './repository.js';
import { createBetterAuthId } from '$lib/server/db/schema/utils.js';
import type { WebhookEvent as AdapterWebhookEvent } from './adapters/adapter.js';
import type { PaymentContext, Order, Payment } from '../types.js';

// Import getPaymentSystem - will be available once system.ts is created
// For now, we'll type it properly and it will be resolved at runtime
type PaymentSystem = {
	getAdapter: (provider: string) => {
		verifyWebhook: (request: Request) => Promise<boolean>;
		parseWebhook: (request: Request) => Promise<AdapterWebhookEvent>;
	};
	emit: (eventType: string, ctx: PaymentContext) => Promise<void>;
};

// This will be imported from ./system.ts once it's created
declare function getPaymentSystem(): PaymentSystem;

/**
 * Process webhook event from payment provider
 *
 * Main entry point for webhook processing. Handles:
 * - Signature verification
 * - Event parsing
 * - Routing to appropriate handler
 *
 * @param request - The webhook request from the payment provider
 * @param provider - Payment provider name (e.g., 'stripe', 'dodopayments')
 * @throws Error if webhook signature is invalid
 *
 * @example
 * ```ts
 * // In your webhook endpoint (e.g., /webhooks/stripe/+server.ts)
 * export async function POST({ request }) {
 *   try {
 *     await processWebhook(request, 'stripe');
 *     return json({ received: true });
 *   } catch (error) {
 *     console.error('Webhook error:', error);
 *     return json({ error: 'Webhook processing failed' }, { status: 400 });
 *   }
 * }
 * ```
 */
export async function processWebhook(request: Request, provider: string): Promise<void> {
	// Get payment system and adapter
	const paymentSystem = getPaymentSystem();
	const adapter = paymentSystem.getAdapter(provider);

	// Verify webhook signature - SECURITY: prevents fake webhooks
	const isValid = await adapter.verifyWebhook(request);
	if (!isValid) {
		throw new Error('Invalid webhook signature');
	}

	// Parse webhook event from provider format
	const event = await adapter.parseWebhook(request);

	// Route event to appropriate handler
	await routeWebhookEvent(event, provider);
}

/**
 * Route webhook event to appropriate handler
 *
 * Normalizes event types across providers and dispatches to handlers.
 * Logs unhandled events for monitoring.
 *
 * @param event - Parsed webhook event from provider
 * @param provider - Payment provider name
 *
 * @example
 * ```ts
 * const event = {
 *   id: 'evt_123',
 *   type: 'checkout.session.completed',
 *   data: { ... },
 *   metadata: { orderId: 'order_abc' }
 * };
 * await routeWebhookEvent(event, 'stripe');
 * // Will call handlePaymentSucceeded()
 * ```
 */
export async function routeWebhookEvent(
	event: AdapterWebhookEvent,
	provider: string
): Promise<void> {
	// Normalize event types across providers
	const normalizedType = normalizeEventType(event.type, provider);

	switch (normalizedType) {
		case 'payment.succeeded':
			await handlePaymentSucceeded(event, provider);
			break;

		case 'payment.failed':
			await handlePaymentFailed(event, provider);
			break;

		case 'payment.refunded':
			await handlePaymentRefunded(event, provider);
			break;

		default:
			// Log unhandled events for monitoring - not an error
			console.log(`Unhandled webhook event: ${event.type} (provider: ${provider})`);
	}
}

/**
 * Normalize event types across payment providers
 *
 * Maps provider-specific event names to our internal normalized names.
 * This allows us to handle different providers uniformly.
 *
 * Normalized event types:
 * - payment.succeeded - Payment completed successfully
 * - payment.failed - Payment failed
 * - payment.refunded - Payment was refunded
 *
 * @param eventType - Provider's event type name
 * @param provider - Payment provider name
 * @returns Normalized event type string
 *
 * @example
 * ```ts
 * normalizeEventType('checkout.session.completed', 'stripe')
 * // Returns: 'payment.succeeded'
 *
 * normalizeEventType('payment_intent.payment_failed', 'stripe')
 * // Returns: 'payment.failed'
 * ```
 */
export function normalizeEventType(eventType: string, provider: string): string {
	if (provider === 'stripe') {
		const stripeMapping: Record<string, string> = {
			'checkout.session.completed': 'payment.succeeded',
			'payment_intent.succeeded': 'payment.succeeded',
			'payment_intent.payment_failed': 'payment.failed',
			'charge.refunded': 'payment.refunded'
		};
		return stripeMapping[eventType] || eventType;
	}

	if (provider === 'polar') {
		const polarMapping: Record<string, string> = {
			'checkout.completed': 'payment.succeeded',
			'checkout.failed': 'payment.failed',
			'order.refunded': 'payment.refunded'
		};
		return polarMapping[eventType] || eventType;
	}

	// Add more provider mappings here as needed
	// if (provider === 'dodopayments') { ... }

	// Return as-is if no mapping found
	return eventType;
}

/**
 * Handle successful payment event
 *
 * Process flow:
 * 1. Extract order ID from metadata
 * 2. Check for duplicate processing (idempotency via providerPaymentId)
 * 3. Get order from database
 * 4. Create payment record
 * 5. Update order status to 'paid'
 * 6. Emit event to payment system for custom handlers
 *
 * @param event - Webhook event data
 * @param provider - Payment provider name
 * @throws Error if order ID is missing or order not found
 *
 * @example
 * ```ts
 * const event = {
 *   id: 'evt_123',
 *   type: 'checkout.session.completed',
 *   data: {
 *     id: 'pi_123',
 *     customer: 'cus_123'
 *   },
 *   metadata: { orderId: 'order_abc' }
 * };
 * await handlePaymentSucceeded(event, 'stripe');
 * // Creates payment record and marks order as paid
 * ```
 */
export async function handlePaymentSucceeded(
	event: AdapterWebhookEvent,
	provider: string
): Promise<void> {
	// Extract order ID from metadata
	const orderId = event.metadata?.orderId;
	if (!orderId) {
		throw new Error('Order ID not found in webhook metadata');
	}

	// Extract provider payment ID from event data
	// Different providers structure this differently
	const providerPaymentId = extractPaymentId(event.data, provider);

	// IDEMPOTENCY CHECK: Prevent duplicate processing
	// If we already processed this payment, skip it
	const existingPayment = await paymentsRepository.findPaymentByProviderPaymentId(providerPaymentId);

	if (existingPayment) {
		console.log('Payment already processed, skipping:', providerPaymentId);
		return;
	}

	// Get order from database
	const order = await paymentsRepository.findOrderById(orderId);
	if (!order) {
		throw new Error(`Order not found: ${orderId}`);
	}

	// Extract customer ID if available
	const providerCustomerId = extractCustomerId(event.data, provider);

	// Create payment record
	const paymentId = createBetterAuthId('payment');
	const payment = await paymentsRepository.createPayment({
		id: paymentId,
		orderId: order.id,
		provider,
		providerPaymentId,
		providerCustomerId: providerCustomerId || null,
		amount: order.totalAmount,
		currency: order.currency,
		status: 'succeeded',
		completedAt: new Date()
	});

	// Update order status to paid
	await paymentsRepository.updateOrder(orderId, {
		status: 'paid',
		completedAt: new Date()
	});

	// Emit event for custom handlers (e.g., publish job, send emails)
	const paymentSystem = getPaymentSystem();
	await paymentSystem.emit('payment.succeeded', {
		event: {
			id: event.id,
			type: event.type,
			provider,
			data: event.data,
			metadata: event.metadata
		},
		order: order as Order,
		payment: payment as Payment,
		provider
	});
}

/**
 * Handle failed payment event
 *
 * Process flow:
 * 1. Extract order ID from metadata
 * 2. Update order status to 'failed'
 * 3. Emit event to payment system for custom handlers (e.g., notifications)
 *
 * Note: We don't create a payment record for failed payments.
 * Only successful payments are stored in the database.
 *
 * @param event - Webhook event data
 * @param provider - Payment provider name
 *
 * @example
 * ```ts
 * const event = {
 *   id: 'evt_123',
 *   type: 'payment_intent.payment_failed',
 *   data: { id: 'pi_123' },
 *   metadata: { orderId: 'order_abc' }
 * };
 * await handlePaymentFailed(event, 'stripe');
 * // Updates order status to 'failed'
 * ```
 */
export async function handlePaymentFailed(
	event: AdapterWebhookEvent,
	provider: string
): Promise<void> {
	const orderId = event.metadata?.orderId;
	if (!orderId) {
		// No order ID means we can't process this failure
		// This might be a retry of a previous payment
		console.warn('Payment failed webhook received without order ID:', event.id);
		return;
	}

	// Update order status to failed
	await paymentsRepository.updateOrder(orderId, {
		status: 'failed'
	});

	// Get order for event emission
	const order = await paymentsRepository.findOrderById(orderId);
	if (!order) {
		console.error(`Order not found for failed payment: ${orderId}`);
		return;
	}

	// Emit event for custom handlers (e.g., send notification to user)
	const paymentSystem = getPaymentSystem();
	await paymentSystem.emit('payment.failed', {
		event: {
			id: event.id,
			type: event.type,
			provider,
			data: event.data,
			metadata: event.metadata
		},
		order: order as Order,
		payment: null as any, // No payment record for failed payments
		provider
	});
}

/**
 * Handle payment refunded event
 *
 * Process flow:
 * 1. Find payment by provider payment ID
 * 2. Update payment status to 'refunded'
 * 3. Update order status to 'refunded'
 * 4. Emit event to payment system for custom handlers
 *
 * Note: This assumes full refunds. Partial refunds would need additional logic.
 *
 * @param event - Webhook event data
 * @param provider - Payment provider name
 *
 * @example
 * ```ts
 * const event = {
 *   id: 'evt_123',
 *   type: 'charge.refunded',
 *   data: {
 *     payment_intent: 'pi_123',
 *     amount_refunded: 5000
 *   }
 * };
 * await handlePaymentRefunded(event, 'stripe');
 * // Updates payment and order status to 'refunded'
 * ```
 */
export async function handlePaymentRefunded(
	event: AdapterWebhookEvent,
	provider: string
): Promise<void> {
	// Extract payment intent ID (different providers structure this differently)
	const paymentIntentId = extractPaymentIdFromRefund(event.data, provider);

	// Find payment record by provider payment ID
	const payment = await paymentsRepository.findPaymentByProviderPaymentId(paymentIntentId);

	if (!payment) {
		console.error('Payment not found for refund:', paymentIntentId);
		return;
	}

	// Update payment status to refunded
	await paymentsRepository.updatePayment(payment.id, {
		status: 'refunded'
	});

	// Update order status to refunded
	await paymentsRepository.updateOrder(payment.orderId, {
		status: 'refunded'
	});

	// Get order for event emission
	const order = await paymentsRepository.findOrderById(payment.orderId);
	if (!order) {
		console.error(`Order not found for refunded payment: ${payment.orderId}`);
		return;
	}

	// Emit event for custom handlers (e.g., unpublish job, send notification)
	const paymentSystem = getPaymentSystem();
	await paymentSystem.emit('payment.refunded', {
		event: {
			id: event.id,
			type: event.type,
			provider,
			data: event.data,
			metadata: event.metadata
		},
		order: order as Order,
		payment: payment as Payment,
		provider
	});
}

// ============================================================================
// Helper Functions - Provider-specific data extraction
// ============================================================================

/**
 * Extract payment ID from webhook data
 * Handles provider-specific data structures
 *
 * @param data - Webhook event data
 * @param provider - Payment provider name
 * @returns Payment ID string
 */
function extractPaymentId(data: any, provider: string): string {
	if (provider === 'stripe') {
		// Stripe uses different fields depending on event type
		return data.payment_intent || data.id;
	}

	// Default: assume data.id is the payment ID
	return data.id;
}

/**
 * Extract customer ID from webhook data
 * Handles provider-specific data structures
 *
 * @param data - Webhook event data
 * @param provider - Payment provider name
 * @returns Customer ID string or null if not available
 */
function extractCustomerId(data: any, provider: string): string | null {
	if (provider === 'stripe') {
		return data.customer || null;
	}

	// Default: try to find customer field
	return data.customer || data.customerId || null;
}

/**
 * Extract payment ID from refund webhook data
 * Handles provider-specific data structures for refund events
 *
 * @param data - Webhook event data
 * @param provider - Payment provider name
 * @returns Payment ID string
 */
function extractPaymentIdFromRefund(data: any, provider: string): string {
	if (provider === 'stripe') {
		// Stripe refund events include the payment_intent
		return data.payment_intent;
	}

	// Default: assume data.paymentId or data.payment_intent
	return data.paymentId || data.payment_intent || data.id;
}
