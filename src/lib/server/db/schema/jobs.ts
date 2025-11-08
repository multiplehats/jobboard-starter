import {
	pgTable,
	text,
	varchar,
	integer,
	boolean,
	timestamp,
	json,
	index,
	unique
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createBetterAuthId } from './utils';
import { user, organization } from './auth';

export const jobs = pgTable(
	'jobs',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('job'))
			.notNull()
			.primaryKey(),

		// Basic info
		title: varchar('title', { length: 255 }).notNull(),
		slug: varchar('slug', { length: 255 }).notNull(), // Unique within organization

		// Rich text (Tiptap JSON)
		description: json('description').notNull(),
		requirements: json('requirements'),
		benefits: json('benefits'),

		// Job details
		locationType: varchar('location_type', { length: 50 }).notNull(), // 'remote' | 'hybrid' | 'onsite'
		location: varchar('location', { length: 255 }), // City, Country
		jobType: varchar('job_type', { length: 50 }).notNull(), // 'full_time' | 'part_time' | 'contract' | 'freelance'

		// Salary
		salaryMin: integer('salary_min'),
		salaryMax: integer('salary_max'),
		salaryCurrency: varchar('salary_currency', { length: 10 }).default('USD'),
		salaryPeriod: varchar('salary_period', { length: 20 }).default('year'), // 'year' | 'month' | 'hour'

		// Application
		applicationUrl: text('application_url').notNull(),
		applicationEmail: varchar('application_email', { length: 255 }),

		// Relations
		organizationId: text('organization_id')
			.references(() => organization.id, { onDelete: 'cascade' })
			.notNull(),
		postedById: text('posted_by_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),

		// Status workflow
		status: varchar('status', { length: 50 }).notNull().default('draft'),
		// 'draft' | 'awaiting_payment' | 'awaiting_approval' | 'published' | 'rejected' | 'expired'

		// Payment
		paymentId: varchar('payment_id', { length: 255 }),
		paidAt: timestamp('paid_at'),

		// Upgrades
		hasNewsletterFeature: boolean('has_newsletter_feature').default(false).notNull(),
		hasExtendedDuration: boolean('has_extended_duration').default(false).notNull(),

		// Lifecycle
		publishedAt: timestamp('published_at'),
		expiresAt: timestamp('expires_at'),

		// Rejection
		rejectionReason: text('rejection_reason'),

		// Analytics
		viewCount: integer('view_count').default(0).notNull(),
		clickCount: integer('click_count').default(0).notNull(),
		applicationCount: integer('application_count').default(0).notNull(),
		saveCount: integer('save_count').default(0).notNull(),

		// Edit tracking
		lastEditedAt: timestamp('last_edited_at'),
		lastEditedById: text('last_edited_by_id').references(() => user.id),
		editCount: integer('edit_count').default(0).notNull(),

		// Soft delete
		deletedAt: timestamp('deleted_at'),

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => ({
		orgSlugIdx: index('jobs_org_slug_idx').on(table.organizationId, table.slug),
		statusIdx: index('jobs_status_idx').on(table.status),
		publishedIdx: index('jobs_published_idx').on(table.publishedAt),
		expiresIdx: index('jobs_expires_idx').on(table.expiresAt),
		uniqueOrgSlug: unique('jobs_org_slug_unique').on(table.organizationId, table.slug)
	})
);
