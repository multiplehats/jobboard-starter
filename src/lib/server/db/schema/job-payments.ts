import { pgTable, text, varchar, integer, timestamp, json, index } from 'drizzle-orm/pg-core';
import { createBetterAuthId } from './utils';
import { jobs } from './jobs';

export const jobPayments = pgTable(
	'job_payments',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('jobPayment'))
			.notNull()
			.primaryKey(),
		jobId: text('job_id')
			.references(() => jobs.id, { onDelete: 'cascade' })
			.notNull(),

		// Payment details
		provider: varchar('provider', { length: 50 }).notNull().default('dodopayments'),
		providerPaymentId: varchar('provider_payment_id', { length: 255 }),

		// Pricing (in cents)
		basePrice: integer('base_price').notNull(),
		upgradesPrice: integer('upgrades_price').default(0).notNull(),
		totalPrice: integer('total_price').notNull(),
		currency: varchar('currency', { length: 10 }).default('EUR').notNull(),

		// Upgrades purchased
		upgrades: json('upgrades').$type<string[]>(),

		// Status
		status: varchar('status', { length: 50 }).notNull().default('pending'),
		// 'pending' | 'completed' | 'failed' | 'refunded'

		// Metadata
		metadata: json('metadata'),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		completedAt: timestamp('completed_at')
	},
	(table) => ({
		jobIdx: index('job_payments_job_idx').on(table.jobId),
		providerPaymentIdx: index('job_payments_provider_payment_idx').on(table.providerPaymentId)
	})
);
