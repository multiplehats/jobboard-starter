/**
 * Payment Adapter Interface
 * DO NOT MODIFY - Core interface for payment providers
 *
 * To add a new provider:
 * 1. Create a new file: src/lib/features/payments/server/adapters/yourprovider.ts
 * 2. Implement the PaymentAdapter interface
 * 3. Register in getPaymentAdapter() factory function
 */

export interface LineItem {
	priceId: string;
	quantity: number;
}

export interface CheckoutSessionParams {
	lineItems: LineItem[];
	successUrl: string;
	cancelUrl: string;
	metadata?: Record<string, string>;
	mode?: 'payment' | 'subscription';
}

export interface CheckoutSession {
	sessionId: string;
	url: string;
}

export interface RefundParams {
	paymentId: string;
	amount?: number; // Optional partial refund
	reason?: string;
}

export interface Refund {
	refundId: string;
	amount: number;
	status: string;
}

/**
 * Webhook event from provider
 */
export interface WebhookEvent {
	id: string;
	type: string;
	data: any;
	metadata?: Record<string, string>;
}

/**
 * Payment provider adapter interface
 */
export interface PaymentAdapter {
	/** Provider name (e.g., 'stripe', 'dodopayments') */
	readonly name: string;

	/** Create a checkout session */
	createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession>;

	/** Verify webhook signature */
	verifyWebhook(request: Request): Promise<boolean>;

	/** Parse webhook event */
	parseWebhook(request: Request): Promise<WebhookEvent>;

	/** Process a refund */
	refund(params: RefundParams): Promise<Refund>;
}
