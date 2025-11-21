import { pgTable, pgEnum, text, varchar, integer, boolean, timestamp, json, index } from 'drizzle-orm/pg-core';
import { createBetterAuthId } from './utils';
import { user } from './auth';
import { PROFILE_VISIBILITY } from '$lib/features/common/constants';
import { CURRENCIES } from '$lib/features/jobs/constants';

// PostgreSQL Enums
export const profileVisibilityEnum = pgEnum('profile_visibility', PROFILE_VISIBILITY);
export const desiredSalaryCurrencyEnum = pgEnum('desired_salary_currency', CURRENCIES);

export const talentProfiles = pgTable(
	'talent_profiles',
	{
		id: text('id')
			.$defaultFn(() => createBetterAuthId('talentProfile'))
			.notNull()
			.primaryKey(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull()
			.unique(),

		// Profile
		bio: text('bio'),
		headline: varchar('headline', { length: 255 }), // "Senior Frontend Engineer"
		location: varchar('location', { length: 255 }),

		// Job preferences
		desiredJobTypes: json('desired_job_types').$type<string[]>(), // ['full_time', 'contract']
		desiredLocationTypes: json('desired_location_types').$type<string[]>(), // ['remote', 'hybrid']
		desiredSalaryMin: integer('desired_salary_min'),
		desiredSalaryCurrency: desiredSalaryCurrencyEnum('desired_salary_currency').default('USD'),

		// Experience
		yearsOfExperience: integer('years_of_experience'),
		skills: json('skills').$type<string[]>(), // ['React', 'TypeScript', 'Node.js']

		// Documents & Links
		resumeUrl: text('resume_url'),
		portfolioUrl: text('portfolio_url'),
		linkedinUrl: text('linkedin_url'),
		githubUrl: text('github_url'),
		websiteUrl: text('website_url'),

		// Settings
		jobAlertsEnabled: boolean('job_alerts_enabled').default(true).notNull(),
		profileVisibility: profileVisibilityEnum('profile_visibility').default('public').notNull(),
		emailNotifications: boolean('email_notifications').default(true).notNull(),

		// Onboarding
		onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
		onboardingStep: integer('onboarding_step').default(0).notNull(), // Track progress

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => ({
		userIdx: index('talent_profiles_user_idx').on(table.userId)
	})
);
