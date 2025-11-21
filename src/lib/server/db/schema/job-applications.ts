import { pgTable, pgEnum, text, varchar, timestamp, json, index, unique } from 'drizzle-orm/pg-core';
import { createBetterAuthId } from './utils';
import { user } from './auth';
import { jobs } from './jobs';
import { APPLICATION_STATUSES } from '$lib/features/common/constants';

// PostgreSQL Enums
export const applicationStatusEnum = pgEnum('application_status', APPLICATION_STATUSES);

export const jobApplications = pgTable(
	'job_applications',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('jobApplication'))
			.notNull()
			.primaryKey(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		jobId: text('job_id')
			.references(() => jobs.id, { onDelete: 'cascade' })
			.notNull(),

		// Application tracking (3 stages)
		status: applicationStatusEnum('status').notNull(),

		// Optional: if we implement in-app applications
		coverLetter: text('cover_letter'),
		customAnswers: json('custom_answers'), // For custom application questions

		// Tracking
		modalShownAt: timestamp('modal_shown_at'),
		ctaClickedAt: timestamp('cta_clicked_at'),
		externalOpenedAt: timestamp('external_opened_at'),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => ({
		userJobIdx: index('job_applications_user_job_idx').on(table.userId, table.jobId),
		userIdx: index('job_applications_user_idx').on(table.userId),
		jobIdx: index('job_applications_job_idx').on(table.jobId),
		userJobUnique: unique('job_applications_user_job_unique').on(table.userId, table.jobId)
	})
);
