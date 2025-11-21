import type { PaymentAdapter } from './adapters/adapter';
import type { PaymentHandler, PaymentContext } from '../types';
import { StripeAdapter } from './adapters/stripe';
import { PolarAdapter } from './adapters/polar';
import { env } from '$env/dynamic/private';

/**
 * Payment System
 * DO NOT MODIFY - Core payment system implementation
 *
 * The PaymentSystem manages payment adapters and event handlers.
 * It provides a central registry for payment providers and a hook-based
 * event system for handling payment lifecycle events.
 *
 * Usage:
 * ```typescript
 * const paymentSystem = getPaymentSystem();
 * paymentSystem.on('payment.succeeded', async (ctx) => {
 *   // Handle successful payment
 *   console.log(`Payment succeeded for order ${ctx.order.id}`);
 * });
 * ```
 */
export class PaymentSystem {
	private adapters = new Map<string, PaymentAdapter>();
	private handlers = new Map<string, PaymentHandler[]>();

	constructor() {
		this.registerDefaultAdapters();
	}

	/**
	 * Register default payment adapters
	 * This is called automatically during construction
	 */
	private registerDefaultAdapters() {
		// Register Stripe if configured
		if (env.STRIPE_SECRET_KEY) {
			this.registerAdapter(new StripeAdapter());
		}

		// Register Polar if configured
		if (env.POLAR_ACCESS_TOKEN) {
			this.registerAdapter(new PolarAdapter());
		}

		// Add more adapters as they're implemented
		// this.registerAdapter(new DodoPaymentsAdapter());
	}

	/**
	 * Register a payment adapter
	 *
	 * @param adapter - The payment adapter to register
	 *
	 * @example
	 * ```typescript
	 * const system = getPaymentSystem();
	 * system.registerAdapter(new CustomAdapter());
	 * ```
	 */
	registerAdapter(adapter: PaymentAdapter) {
		this.adapters.set(adapter.name, adapter);
	}

	/**
	 * Get adapter by provider name
	 *
	 * @param provider - The provider name (e.g., 'stripe', 'dodopayments')
	 * @returns The payment adapter for the provider
	 * @throws Error if adapter is not found
	 *
	 * @example
	 * ```typescript
	 * const system = getPaymentSystem();
	 * const adapter = system.getAdapter('stripe');
	 * ```
	 */
	getAdapter(provider: string): PaymentAdapter {
		const adapter = this.adapters.get(provider);
		if (!adapter) {
			throw new Error(`Payment adapter not found: ${provider}`);
		}
		return adapter;
	}

	/**
	 * Register event handler
	 *
	 * Event types:
	 * - payment.succeeded: Payment completed successfully
	 * - payment.failed: Payment failed
	 * - payment.refunded: Payment was refunded
	 *
	 * @param eventType - The event type to handle
	 * @param handler - The handler function to execute
	 *
	 * @example
	 * ```typescript
	 * const system = getPaymentSystem();
	 * system.on('payment.succeeded', async (ctx) => {
	 *   // Publish job, send confirmation email, etc.
	 *   await publishJob(ctx.order.metadata.jobIds[0]);
	 * });
	 * ```
	 */
	on(eventType: string, handler: PaymentHandler) {
		const handlers = this.handlers.get(eventType) || [];
		handlers.push(handler);
		this.handlers.set(eventType, handlers);
	}

	/**
	 * Execute handlers for event
	 *
	 * @param eventType - The event type
	 * @param ctx - The payment context
	 *
	 * @example
	 * ```typescript
	 * await paymentSystem.emit('payment.succeeded', {
	 *   event: webhookEvent,
	 *   order: order,
	 *   payment: payment,
	 *   provider: 'stripe'
	 * });
	 * ```
	 */
	async emit(eventType: string, ctx: PaymentContext) {
		const handlers = this.handlers.get(eventType) || [];

		for (const handler of handlers) {
			try {
				await handler(ctx);
			} catch (error) {
				console.error(`Error in payment handler for ${eventType}:`, error);
				throw error;
			}
		}
	}
}

// Singleton instance
let paymentSystem: PaymentSystem;

/**
 * Get payment system instance (singleton)
 *
 * @returns The payment system singleton
 *
 * @example
 * ```typescript
 * const system = getPaymentSystem();
 * const adapter = system.getAdapter('stripe');
 * ```
 */
export function getPaymentSystem(): PaymentSystem {
	if (!paymentSystem) {
		paymentSystem = new PaymentSystem();
	}
	return paymentSystem;
}
