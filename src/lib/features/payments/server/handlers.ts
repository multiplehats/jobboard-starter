import { db } from '$lib/server/db';
import { jobs } from '$lib/server/db/schema';
import { getProductsConfig } from '$lib/config/products';
import { eq } from 'drizzle-orm';
import type { PaymentContext } from '../types';
import type { PaymentSystem } from './system';

/**
 * Default payment handlers
 * These are registered automatically but can be overridden by users
 */

/**
 * Register default handlers
 * Call this during app initialization to set up payment event handlers
 *
 * @param system - The payment system instance to register handlers with
 *
 * @example
 * ```typescript
 * import { getPaymentSystem } from './system';
 * import { registerDefaultHandlers } from './handlers';
 *
 * const system = getPaymentSystem();
 * registerDefaultHandlers(system);
 * ```
 */
export function registerDefaultHandlers(system: PaymentSystem) {
	// Register handler for successful job posting payments
	system.on('payment.succeeded', handleJobPostingPayment);

	// Register handler for refunded job posting payments
	system.on('payment.refunded', handleJobPostingRefund);

	console.log('Default payment handlers registered');
}

/**
 * Handle job posting payment success
 * Publishes jobs and applies upsells after successful payment
 */
export async function handleJobPostingPayment(ctx: PaymentContext): Promise<void> {
	const { order, payment } = ctx;

	// Get job IDs and upsells from order metadata
	const jobIds = (order.metadata?.jobIds as string[]) || [];
	const upsells = (order.metadata?.upsells as string[]) || [];

	if (jobIds.length === 0) {
		console.warn('No job IDs found in order metadata:', order.id);
		return;
	}

	// Get products config to calculate expiration
	const config = getProductsConfig();

	// Process each job
	for (const jobId of jobIds) {
		try {
			// Publish job
			await db
				.update(jobs)
				.set({
					status: 'published',
					publishedAt: new Date(),
					expiresAt: calculateExpirationDate(config.jobPosting.duration),
					selectedUpsells: upsells,
					// Store payment reference directly in job
					paymentId: payment.id,
					paidAmount: order.totalAmount
				})
				.where(eq(jobs.id, jobId));

			console.log(`Job published successfully: ${jobId}`);
		} catch (error) {
			console.error(`Failed to publish job ${jobId}:`, error);
			// Continue processing other jobs even if one fails
		}
	}
}

/**
 * Handle job posting refund
 * Unpublishes jobs after payment refund
 */
export async function handleJobPostingRefund(ctx: PaymentContext): Promise<void> {
	const { order } = ctx;

	const jobIds = (order.metadata?.jobIds as string[]) || [];

	if (jobIds.length === 0) {
		console.warn('No job IDs found in order metadata:', order.id);
		return;
	}

	// Process each job
	for (const jobId of jobIds) {
		try {
			// Unpublish job
			await db
				.update(jobs)
				.set({
					status: 'draft',
					publishedAt: null,
					expiresAt: null
				})
				.where(eq(jobs.id, jobId));

			console.log(`Job unpublished due to refund: ${jobId}`);
		} catch (error) {
			console.error(`Failed to unpublish job ${jobId}:`, error);
			// Continue processing other jobs even if one fails
		}
	}
}

/**
 * Calculate job expiration date based on duration in days
 *
 * @param durationDays - Number of days the job should be active
 * @returns Date when the job should expire
 */
export function calculateExpirationDate(durationDays: number): Date {
	const now = Date.now();
	const milliseconds = durationDays * 24 * 60 * 60 * 1000;
	return new Date(now + milliseconds);
}
