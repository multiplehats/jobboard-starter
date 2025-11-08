import { pgTable, text, varchar, timestamp, json, index } from 'drizzle-orm/pg-core';
import { createBetterAuthId } from './utils';
import { user } from './auth';

export const adminActions = pgTable(
	'admin_actions',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('adminAction'))
			.notNull()
			.primaryKey(),
		adminId: text('admin_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),

		action: varchar('action', { length: 50 }).notNull(),
		// 'approve_job' | 'reject_job' | 'verify_org' | 'scrape_job'

		targetType: varchar('target_type', { length: 50 }).notNull(),
		// 'job' | 'organization' | 'user'

		targetId: varchar('target_id', { length: 255 }).notNull(),

		details: json('details'),
		// Example: { reason: 'Spam content' } for rejection

		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => ({
		adminIdx: index('admin_actions_admin_idx').on(table.adminId),
		targetIdx: index('admin_actions_target_idx').on(table.targetType, table.targetId)
	})
);
