import { pgTable, text, integer, timestamp, json, index } from 'drizzle-orm/pg-core';
import { createBetterAuthId } from './utils';
import { user } from './auth';

/**
 * Payment Database Schema
 * Implementation of Payment System V2
 *
 * SIMPLIFIED ARCHITECTURE:
 * - No job_payments junction table
 * - All business logic in order.metadata
 * - Text status fields (NOT enums) for easier extension
 * - All monetary amounts in cents
 */

// ============================================================================
// Orders Table
// ============================================================================

export const orders = pgTable(
	'orders',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('order'))
			.notNull()
			.primaryKey(),

		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),

		// Order details
		items: json('items').$type<OrderItem[]>().notNull(),
		totalAmount: integer('total_amount').notNull(), // In cents
		currency: text('currency').default('USD').notNull(),

		// Status (text for easier extension, NOT enum)
		// Values: pending, paid, failed, refunded, canceled
		status: text('status').default('pending').notNull(),

		// Provider reference
		provider: text('provider'), // stripe, dodopayments, etc.
		providerSessionId: text('provider_session_id'),

		// Metadata (extensible) - stores job IDs, upsells, etc.
		metadata: json('metadata').$type<OrderMetadata>(),

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		completedAt: timestamp('completed_at')
	},
	(table) => ({
		userIdx: index('orders_user_idx').on(table.userId),
		statusIdx: index('orders_status_idx').on(table.status),
		providerSessionIdx: index('orders_provider_session_idx').on(table.providerSessionId)
	})
);

// ============================================================================
// Payments Table
// ============================================================================

export const payments = pgTable(
	'payments',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('payment'))
			.notNull()
			.primaryKey(),

		orderId: text('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull(),

		// Payment provider details
		provider: text('provider').notNull(),
		providerPaymentId: text('provider_payment_id').notNull().unique(),
		providerCustomerId: text('provider_customer_id'),

		// Amount
		amount: integer('amount').notNull(), // In cents
		currency: text('currency').default('USD').notNull(),

		// Status (text for easier extension, NOT enum)
		// Values: pending, processing, succeeded, failed, refunded
		status: text('status').default('pending').notNull(),

		// Metadata (extensible)
		metadata: json('metadata'),

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		completedAt: timestamp('completed_at')
	},
	(table) => ({
		orderIdx: index('payments_order_idx').on(table.orderId),
		providerPaymentIdx: index('payments_provider_payment_idx').on(table.providerPaymentId),
		statusIdx: index('payments_status_idx').on(table.status)
	})
);

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Order item structure
 * Matches the Zod schema from validators.ts
 */
export interface OrderItem {
	productId: string;
	quantity: number;
	metadata?: Record<string, unknown>;
}

/**
 * Order metadata types
 * Extensible structure for storing business-specific data
 */
export interface OrderMetadata {
	// Job posting specific
	jobIds?: string[]; // Jobs associated with this order
	upsells?: string[]; // Selected upsell IDs

	// Extensible for future product types
	[key: string]: unknown;
}

// ============================================================================
// Type Exports
// ============================================================================

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
