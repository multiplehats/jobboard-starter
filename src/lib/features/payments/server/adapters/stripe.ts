import Stripe from 'stripe';
import type {
	PaymentAdapter,
	CheckoutSessionParams,
	CheckoutSession,
	RefundParams,
	Refund,
	WebhookEvent
} from './adapter';
import { env } from '$env/dynamic/private';

/**
 * Stripe Payment Adapter
 * DO NOT MODIFY - Core Stripe integration
 */
export class StripeAdapter implements PaymentAdapter {
	readonly name = 'stripe';
	private stripe: Stripe;

	constructor() {
		if (!env.STRIPE_SECRET_KEY) {
			throw new Error('STRIPE_SECRET_KEY environment variable is required');
		}

		this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
			apiVersion: '2025-11-17.clover'
		});
	}

	async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession> {
		try {
			const session = await this.stripe.checkout.sessions.create({
				line_items: params.lineItems,
				mode: params.mode || 'payment',
				success_url: params.successUrl,
				cancel_url: params.cancelUrl,
				metadata: params.metadata
			});

			if (!session.url) {
				throw new Error('Stripe checkout session created but URL is missing');
			}

			return {
				sessionId: session.id,
				url: session.url
			};
		} catch (error) {
			if (error instanceof Stripe.errors.StripeError) {
				throw new Error(`Stripe error: ${error.message}`);
			}
			throw error;
		}
	}

	async verifyWebhook(request: Request): Promise<boolean> {
		const signature = request.headers.get('stripe-signature');
		if (!signature) {
			return false;
		}

		if (!env.STRIPE_WEBHOOK_SECRET) {
			throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
		}

		try {
			const body = await request.text();
			this.stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
			return true;
		} catch {
			return false;
		}
	}

	async parseWebhook(request: Request): Promise<WebhookEvent> {
		const signature = request.headers.get('stripe-signature');
		if (!signature) {
			throw new Error('Missing stripe-signature header');
		}

		if (!env.STRIPE_WEBHOOK_SECRET) {
			throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
		}

		try {
			const body = await request.text();
			const event = this.stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

			return {
				id: event.id,
				type: event.type,
				data: event.data.object,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				metadata: (event.data.object as any).metadata || {}
			};
		} catch (error) {
			if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
				throw new Error(`Webhook signature verification failed: ${error.message}`);
			}
			throw error;
		}
	}

	async refund(params: RefundParams): Promise<Refund> {
		try {
			const refund = await this.stripe.refunds.create({
				payment_intent: params.paymentId,
				amount: params.amount,
				reason: params.reason as Stripe.RefundCreateParams.Reason
			});

			if (!refund.status) {
				throw new Error('Stripe refund created but status is missing');
			}

			return {
				refundId: refund.id,
				amount: refund.amount,
				status: refund.status
			};
		} catch (error) {
			if (error instanceof Stripe.errors.StripeError) {
				throw new Error(`Stripe refund error: ${error.message}`);
			}
			throw error;
		}
	}
}
