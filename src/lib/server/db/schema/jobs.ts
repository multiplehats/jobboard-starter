import {
	pgTable,
	pgEnum,
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
import {
	LOCATION_TYPES,
	JOB_TYPES,
	JOB_STATUSES,
	SENIORITY_LEVELS,
	HIRING_LOCATION_TYPES,
	WORKING_PERMITS_TYPES,
	CURRENCIES,
	SALARY_PERIODS
} from '$lib/features/jobs/constants';

// PostgreSQL Enums (using constants from shared file)
export const locationTypeEnum = pgEnum('location_type', LOCATION_TYPES);
export const jobTypeEnum = pgEnum('job_type', JOB_TYPES);
export const jobStatusEnum = pgEnum('job_status', JOB_STATUSES);
export const seniorityLevelEnum = pgEnum('seniority_level', SENIORITY_LEVELS);
export const hiringLocationTypeEnum = pgEnum('hiring_location_type', HIRING_LOCATION_TYPES);
export const workingPermitsTypeEnum = pgEnum('working_permits_type', WORKING_PERMITS_TYPES);
export const currencyEnum = pgEnum('currency', CURRENCIES);
export const salaryPeriodEnum = pgEnum('salary_period', SALARY_PERIODS);

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
		locationType: locationTypeEnum('location_type').notNull(),
		location: varchar('location', { length: 255 }), // City, Country
		jobType: jobTypeEnum('job_type').notNull(),

		// Salary
		salaryMin: integer('salary_min'),
		salaryMax: integer('salary_max'),
		salaryCurrency: currencyEnum('salary_currency').default('USD').notNull(),
		salaryPeriod: salaryPeriodEnum('salary_period').default('year').notNull(),

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
		status: jobStatusEnum('status').notNull().default('draft'),

		// Payment
		paymentId: varchar('payment_id', { length: 255 }),
		paidAt: timestamp('paid_at'),

		// Upgrades (flexible - stores array of purchased upsell IDs from pricing config)
		// Example: ["email_newsletter", "priority_placement"]
		selectedUpsells: json('selected_upsells').$type<string[]>().default(sql`'[]'::json`).notNull(),

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
