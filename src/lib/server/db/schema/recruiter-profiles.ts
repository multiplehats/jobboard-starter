import { pgTable, text, varchar, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { createBetterAuthId } from './utils';
import { user, organization } from './auth';

export const recruiterProfiles = pgTable(
	'recruiter_profiles',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('recruiterProfile'))
			.notNull()
			.primaryKey(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull()
			.unique(),

		// Professional info
		jobTitle: varchar('job_title', { length: 255 }), // "Head of Talent"
		company: varchar('company', { length: 255 }), // Display name (may differ from org)
		linkedinUrl: text('linkedin_url'),

		// Preferences
		defaultOrganizationId: text('default_organization_id').references(() => organization.id), // Last used org

		// Onboarding
		onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
		onboardingStep: integer('onboarding_step').default(0).notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => ({
		userIdx: index('recruiter_profiles_user_idx').on(table.userId)
	})
);
