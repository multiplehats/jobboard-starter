import { pgTable, pgEnum, text, varchar, integer, timestamp, json, index } from 'drizzle-orm/pg-core';
import { createBetterAuthId } from './utils';
import { jobs } from './jobs';
import { PAYMENT_STATUSES } from '$lib/features/common/constants';
import { CURRENCIES } from '$lib/features/jobs/constants';

// PostgreSQL Enums
export const paymentStatusEnum = pgEnum('payment_status', PAYMENT_STATUSES);
export const paymentCurrencyEnum = pgEnum('payment_currency', CURRENCIES);

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
		currency: paymentCurrencyEnum('currency').default('EUR').notNull(),

		// Upgrades purchased
		upgrades: json('upgrades').$type<string[]>(),

		// Status
		status: paymentStatusEnum('status').notNull().default('pending'),

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
