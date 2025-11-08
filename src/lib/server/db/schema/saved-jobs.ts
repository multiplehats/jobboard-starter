import { pgTable, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { createBetterAuthId } from '$lib/utils/id';
import { user } from '../schema';
import { jobs } from './jobs';

export const savedJobs = pgTable(
	'saved_jobs',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('savedJob'))
			.notNull()
			.primaryKey(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		jobId: text('job_id')
			.references(() => jobs.id, { onDelete: 'cascade' })
			.notNull(),

		notes: text('notes'), // Private notes for the user

		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => ({
		userJobIdx: index('saved_jobs_user_job_idx').on(table.userId, table.jobId),
		uniqueUserJob: unique('saved_jobs_user_job_unique').on(table.userId, table.jobId)
	})
);
