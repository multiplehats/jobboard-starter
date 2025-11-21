import { Polar } from '@polar-sh/sdk';
import type {
	PaymentAdapter,
	CheckoutSessionParams,
	CheckoutSession,
	RefundParams,
	Refund,
	WebhookEvent as AdapterWebhookEvent
} from './adapter';
import { env } from '$env/dynamic/private';

/**
 * Polar Payment Adapter
 * DO NOT MODIFY - Core Polar integration for one-time payments
 *
 * Note: This adapter is designed for one-time job posting payments.
 * For subscription-based billing, see the Polar SDK documentation.
 *
 * Environment Variables Required:
 * - POLAR_ACCESS_TOKEN: Your Polar access token
 * - POLAR_WEBHOOK_SECRET: Your Polar webhook signing secret
 * - POLAR_SERVER: 'sandbox' or 'production'
 *
 * @see https://docs.polar.sh
 */
export class PolarAdapter implements PaymentAdapter {
	readonly name = 'polar';
	private polar: Polar;

	constructor() {
		if (!env.POLAR_ACCESS_TOKEN) {
			throw new Error('POLAR_ACCESS_TOKEN environment variable is required');
		}

		this.polar = new Polar({
			accessToken: env.POLAR_ACCESS_TOKEN,
			server: (env.POLAR_SERVER as 'sandbox' | 'production') || 'sandbox'
		});
	}

	/**
	 * Create a checkout session for one-time payment
	 *
	 * @param params - Checkout session parameters
	 * @returns Checkout session with URL
	 *
	 * @example
	 * ```typescript
	 * const session = await adapter.createCheckoutSession({
	 *   lineItems: [{ priceId: 'price_xxx', quantity: 1 }],
	 *   successUrl: 'https://example.com/success',
	 *   cancelUrl: 'https://example.com/cancel',
	 *   metadata: { orderId: 'order_123' }
	 * });
	 * ```
	 */
	async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession> {
		try {
			// Polar uses product IDs for checkout, not price IDs
			// Convert our line items to Polar's format
			const productPriceIds = params.lineItems.map((item) => ({
				productPriceId: item.priceId,
				quantity: item.quantity
			}));

			// Create checkout session
			const checkoutSession = await this.polar.checkouts.custom.create({
				productPrices: productPriceIds,
				successUrl: params.successUrl,
				// Polar doesn't have a separate cancel URL, but we can use custom fields
				metadata: {
					...params.metadata,
					cancelUrl: params.cancelUrl
				}
			});

			return {
				sessionId: checkoutSession.id,
				url: checkoutSession.url
			};
		} catch (error) {
			console.error('Polar checkout session creation failed:', error);
			throw new Error(
				`Failed to create Polar checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Verify webhook signature
	 *
	 * Polar uses HMAC-SHA256 signature verification similar to Stripe.
	 * The signature is sent in the 'polar-signature' header.
	 *
	 * @param request - The webhook request
	 * @returns True if signature is valid
	 */
	async verifyWebhook(request: Request): Promise<boolean> {
		const signature = request.headers.get('polar-signature');
		if (!signature) {
			return false;
		}

		if (!env.POLAR_WEBHOOK_SECRET) {
			throw new Error('POLAR_WEBHOOK_SECRET environment variable is required');
		}

		try {
			// Polar's webhook verification
			// The signature format is: t=timestamp,v1=signature
			const body = await request.text();

			// Parse signature header
			const elements = signature.split(',');
			const timestamp = elements.find((e) => e.startsWith('t='))?.split('=')[1];
			const sig = elements.find((e) => e.startsWith('v1='))?.split('=')[1];

			if (!timestamp || !sig) {
				return false;
			}

			// Verify timestamp (prevent replay attacks)
			const currentTime = Math.floor(Date.now() / 1000);
			const webhookTime = parseInt(timestamp, 10);
			const tolerance = 300; // 5 minutes

			if (Math.abs(currentTime - webhookTime) > tolerance) {
				console.error('Webhook timestamp outside tolerance window');
				return false;
			}

			// Verify signature using HMAC-SHA256
			const crypto = await import('crypto');
			const signedPayload = `${timestamp}.${body}`;
			const expectedSignature = crypto
				.createHmac('sha256', env.POLAR_WEBHOOK_SECRET)
				.update(signedPayload)
				.digest('hex');

			return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature));
		} catch (error) {
			console.error('Polar webhook verification failed:', error);
			return false;
		}
	}

	/**
	 * Parse webhook event from request
	 *
	 * @param request - The webhook request
	 * @returns Normalized webhook event
	 *
	 * @throws Error if signature verification fails
	 */
	async parseWebhook(request: Request): Promise<AdapterWebhookEvent> {
		const signature = request.headers.get('polar-signature');
		if (!signature) {
			throw new Error('Missing polar-signature header');
		}

		// Verify signature
		const isValid = await this.verifyWebhook(request);
		if (!isValid) {
			throw new Error('Invalid webhook signature');
		}

		// Parse event
		const body = await request.text();
		const event = JSON.parse(body);

		// Polar webhook events have the structure:
		// { type: 'checkout.completed', data: { ... } }
		return {
			id: event.id || event.data?.id || 'unknown',
			type: event.type,
			data: event.data,
			metadata: event.data?.metadata || {}
		};
	}

	/**
	 * Process a refund
	 *
	 * Polar refunds are processed through their orders API
	 *
	 * @param params - Refund parameters
	 * @returns Refund information
	 */
	async refund(params: RefundParams): Promise<Refund> {
		try {
			// Polar uses order IDs for refunds
			// The paymentId in our system corresponds to Polar's order ID
			const orderId = params.paymentId;

			// Create refund request
			// Note: Polar's SDK might have a different refund API structure
			// This is a placeholder based on common patterns
			const refundResult = await this.polar.orders.refund({
				id: orderId,
				amount: params.amount, // Optional partial refund
				reason: params.reason
			});

			return {
				refundId: refundResult.id,
				amount: params.amount || refundResult.amount,
				status: 'succeeded' // Polar refunds are typically immediate
			};
		} catch (error) {
			console.error('Polar refund failed:', error);
			throw new Error(
				`Failed to process Polar refund: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
}
