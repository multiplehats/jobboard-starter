/**
 * Webhook API Route
 * Handles incoming webhook events from payment providers
 *
 * Route: POST /api/webhooks/[provider]
 * Example: POST /api/webhooks/stripe
 *
 * Security:
 * - No authentication required (signature verified internally by adapter)
 * - Webhook signature validation handled by processWebhook
 *
 * Architecture:
 * - Extracts provider from URL params
 * - Delegates processing to payment system webhook handler
 * - Returns success/error responses per provider expectations
 *
 * Following backend-architecture.md patterns
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processWebhook } from '$lib/features/payments/server/webhooks';

/**
 * POST handler for webhook events
 *
 * Process flow:
 * 1. Extract provider from URL params
 * 2. Pass request to processWebhook for signature verification and processing
 * 3. Return success response
 * 4. Handle errors with appropriate status codes
 *
 * @param request - Raw webhook request from payment provider
 * @param params - URL parameters containing provider name
 * @returns JSON response indicating success or failure
 *
 * @example
 * ```bash
 * # Stripe webhook
 * curl -X POST https://example.com/api/webhooks/stripe \
 *   -H "stripe-signature: t=..." \
 *   -d '{"type":"checkout.session.completed",...}'
 *
 * # Response: {"received":true}
 * ```
 */
export const POST: RequestHandler = async ({ request, params }) => {
	const { provider } = params;

	try {
		// Process webhook through payment system
		// This will:
		// - Verify webhook signature via adapter
		// - Parse webhook event
		// - Route to appropriate handler
		// - Update database
		// - Emit events to custom handlers
		await processWebhook(request, provider);

		// Return success response
		// Payment providers expect 200 OK to acknowledge receipt
		return json({ received: true });
	} catch (error) {
		// Log error for monitoring and debugging
		console.error('Webhook processing error:', {
			provider,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});

		// Determine appropriate status code
		// 400 = Bad request (invalid signature, malformed data)
		// 500 = Server error (database issues, unexpected errors)
		const isValidationError =
			error instanceof Error && error.message.includes('Invalid webhook signature');

		const statusCode = isValidationError ? 400 : 500;

		// Return error response
		// Keep error message generic for security
		return json(
			{
				error: isValidationError ? 'Invalid webhook signature' : 'Processing failed'
			},
			{ status: statusCode }
		);
	}
};
