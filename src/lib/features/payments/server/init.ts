import { getPaymentSystem } from './system';
import { registerDefaultHandlers } from './handlers';

/**
 * Initialize the payment system
 *
 * This function should be called once during app startup (e.g., in hooks.server.ts).
 * It initializes the payment system singleton and registers all default payment handlers.
 *
 * The payment system manages:
 * - Payment adapters (Stripe, DodoPayments, etc.)
 * - Event handlers (payment.succeeded, payment.failed, payment.refunded)
 * - Webhook processing
 *
 * @returns The initialized payment system instance for further customization
 *
 * @example
 * ```typescript
 * // In hooks.server.ts or startup module
 * import { initPaymentSystem } from '$lib/features/payments/server/init';
 *
 * // Initialize during app startup
 * const paymentSystem = initPaymentSystem();
 *
 * // Optional: Register custom handlers
 * paymentSystem.on('payment.succeeded', async (ctx) => {
 *   // Custom logic
 * });
 * ```
 */
export function initPaymentSystem() {
	const system = getPaymentSystem();
	registerDefaultHandlers(system);
	return system;
}
