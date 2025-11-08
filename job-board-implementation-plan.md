# Job Board Starter - Complete Implementation Plan

> Updated architecture with talent/recruiter user types and improved URL structure

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [URL Structure](#url-structure)
4. [User Types & State Management](#user-types--state-management)
5. [Authentication & Signup Flow](#authentication--signup-flow)
6. [Implementation Phases](#implementation-phases)
7. [Route Structure](#route-structure)
8. [Repository Patterns](#repository-patterns)

---

## Architecture Overview

### Core Decisions

✅ **Homepage**: Always shows jobs (talent-focused, but accessible to all)
✅ **Recruiter Browsing**: Recruiters can browse without posting
✅ **Profile Creation**: Create only the chosen profile initially (lazy creation of second profile)
✅ **Dashboards**: Separate routes `/dashboard/talent` and `/dashboard/recruiter`
✅ **URL Structure**: `/companies/{company-slug}/jobs/{job-slug}` (RESTful, clean)

### User Type System

```typescript
enum UserState {
	'TALENT', // Has talent_profile only
	'RECRUITER' // Has recruiter_profile only
}
```

## Tech Stack

### Core

- **Framework**: SvelteKit with Svelte 5 ([SvelteKit Docs](https://svelte.dev/llms.txt))
- **Database**: PostgreSQL with Drizzle ORM (Neon as provider)
- **Package Manager**: pnpm
- **Image Storage**: Cloudflare Images

### Authentication

- **Better Auth + better-auth-ui-svelte**:
  - Better Auth Core: ([Docs](https://www.better-auth.com/llms.txt))
  - Better Auth UI Svelte: ([GitHub](https://raw.githubusercontent.com/multiplehats/better-auth-ui-svelte/refs/heads/main/README.md))
  - Pre-built, production-ready Svelte 5 auth components
  - Email/password authentication with built-in validation
  - Additional fields support for custom user type selection
  - Automatic session management
  - Single catch-all route pattern (`/auth/[path]`)
  - **Organizations Plugin**: Built-in multi-tenancy with members, roles, invitations, and teams
  - **Key benefit**: No need for custom form actions or validation logic

### Payments

- **DodoPayments**: ([Docs](https://docs.dodopayments.com/llms-full.txt))
  - Subscription-based payments for job listing upgrades
  - Base listing included (no charge)
  - Monthly recurring subscriptions
  - Swappable payment interface design
  - Multi-currency support for salary display

### Rich Text

- **Tiptap**: JSON-based rich text editor
  - Store as JSON in database
  - Render on frontend with Tiptap renderer
  - Used for: job description (labeled "About the role")

### Fan-out System & Email

- **Workflow**: ([Docs](https://useworkflow.dev/docs/getting-started/sveltekit))
  - Event orchestration and fan-out
  - Real-time notifications
  - Complex workflow automation
- **Bento**: ([Docs](https://docs.bentonow.com))
  - Transactional email delivery
  - User identification and tracking
  - Email templates (job published, payment received, etc.)
  - Newsletter management

### AI-Powered Scraping

- **AI SDK**: ([Docs](https://ai-sdk.dev/llms.txt))
  - User-facing job scraping from URLs during job creation
  - Automatic field extraction from ATS platforms (Greenhouse, Lever, Workday, SmartRecruiters, etc.)
  - Prefills job form with extracted data

### UI

- **shadcn-svelte**: Pre-built components
- **better-auth-ui-svelte**: Pre-built auth components
- **Tailwind CSS**: Utility-first styling

---

## Database Schema

### Better Auth Tables (Auto-created), but for our custom columns, we still need to add it.

### User Profile Tables

```typescript
// ============================================
// TALENT PROFILES
// ============================================
talent_profiles = pgTable(
	'talent_profiles',
	{
		id: t
			.text('id')
			.$defaultFn(() => createBetterAuthId('talentProfile'))
			.notNull()
			.primaryKey(),
		userId: text('user_id')
			.references(() => user.id)
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
		desiredSalaryCurrency: varchar('desired_salary_currency', { length: 10 }).default('USD'),

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
		profileVisibility: varchar('profile_visibility', { length: 20 }).default('public').notNull(), // 'public' | 'private'
		emailNotifications: boolean('email_notifications').default(true).notNull(),

		// Onboarding
		onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
		onboardingStep: integer('onboarding_step').default(0).notNull(), // Track progress

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('talent_profiles_user_idx').on(table.userId)
	})
);

// ============================================
// RECRUITER PROFILES
// ============================================
recruiter_profiles = pgTable(
	'recruiter_profiles',
	{
		id: t
			.text('id')
			.$defaultFn(() => createBetterAuthId('recruiterProfile'))
			.notNull()
			.primaryKey(),
		userId: text('user_id')
			.references(() => user.id)
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
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('recruiter_profiles_user_idx').on(table.userId)
	})
);
```

### Talent Feature Tables

```typescript
// ============================================
// SAVED JOBS (Talent Feature)
// ============================================
saved_jobs = pgTable(
	'saved_jobs',
	{
		id: t
			.text('id')
			.$defaultFn(() => createBetterAuthId('savedJob'))
			.notNull()
			.primaryKey(),
		userId: text('user_id')
			.references(() => user.id)
			.notNull(),
		jobId: integer('job_id')
			.references(() => jobs.id)
			.notNull(),

		notes: text('notes'), // Private notes for the user

		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => ({
		userJobIdx: index('saved_jobs_user_job_idx').on(table.userId, table.jobId),
		uniqueUserJob: unique('saved_jobs_user_job_unique').on(table.userId, table.jobId)
	})
);

// ============================================
// JOB APPLICATIONS (Talent Feature)
// ============================================
job_applications = pgTable(
	'job_applications',
	{
		id: t
			.text('id')
			.$defaultFn(() => createBetterAuthId('jobApplication'))
			.notNull()
			.primaryKey(),
		userId: text('user_id')
			.references(() => user.id)
			.notNull(),
		jobId: integer('job_id')
			.references(() => jobs.id)
			.notNull(),

		// Application tracking (3 stages)
		status: varchar('status', { length: 50 }).notNull(), // 'modal_shown' | 'cta_clicked' | 'external_opened'

		// Optional: if we implement in-app applications
		coverLetter: text('cover_letter'),
		customAnswers: json('custom_answers'), // For custom application questions

		// Tracking
		modalShownAt: timestamp('modal_shown_at'),
		ctaClickedAt: timestamp('cta_clicked_at'),
		externalOpenedAt: timestamp('external_opened_at'),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		userJobIdx: index('job_applications_user_job_idx').on(table.userId, table.jobId),
		userIdx: index('job_applications_user_idx').on(table.userId),
		jobIdx: index('job_applications_job_idx').on(table.jobId),
		uniqueUserJob: unique('job_applications_user_job_unique').on(table.userId, table.jobId)
	})
);
```

### Job & Payment Tables (Updated)

```typescript
// ============================================
// JOBS
// ============================================
jobs = pgTable(
	'jobs',
	{
		id: t
			.text('id')
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
			.references(() => organization.id)
			.notNull(),
		postedById: text('posted_by_id')
			.references(() => user.id)
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
		saveCount: integer('save_count').default(0).notNull(), // NEW: track saves

		// Full-text search
		searchVector: tsvector('search_vector').generatedAlwaysAs(
			sql`to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(location, '') || ' ' ||
        coalesce(jsonb_extract_path_text(description, 'content'), '')
      )`
		),

		// Edit tracking
		lastEditedAt: timestamp('last_edited_at'),
		lastEditedById: text('last_edited_by_id').references(() => user.id),
		editCount: integer('edit_count').default(0).notNull(),

		// Soft delete
		deletedAt: timestamp('deleted_at'),

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		orgSlugIdx: index('jobs_org_slug_idx').on(table.organizationId, table.slug),
		statusIdx: index('jobs_status_idx').on(table.status),
		publishedIdx: index('jobs_published_idx').on(table.publishedAt),
		expiresIdx: index('jobs_expires_idx').on(table.expiresAt),
		searchIdx: index('jobs_search_idx').using('gin', table.searchVector),
		uniqueOrgSlug: unique('jobs_org_slug_unique').on(table.organizationId, table.slug)
	})
);

// ============================================
// JOB PAYMENTS
// ============================================
job_payments = pgTable(
	'job_payments',
	{
		id: t
			.text('id')
			.$defaultFn(() => createBetterAuthId('jobPayment'))
			.notNull()
			.primaryKey(),
		jobId: integer('job_id')
			.references(() => jobs.id)
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

// ============================================
// ADMIN ACTIONS
// ============================================
admin_actions = pgTable(
	'admin_actions',
	{
		id: t
			.text('id')
			.$defaultFn(() => createBetterAuthId('adminAction'))
			.notNull()
			.primaryKey(),
		adminId: text('admin_id')
			.references(() => user.id)
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
```

---

## URL Structure

### New Clean URL Format

```
OLD: /jobs/{job-slug}-at-{company-slug}-{id-prefix}
NEW: /companies/{company-slug}/jobs/{job-slug}
```

**Examples:**

```
✅ /companies/stellar-ai/jobs/senior-software-engineer
✅ /companies/acme-corp/jobs/frontend-engineer
✅ /companies/techstartup/jobs/devops-engineer

// Organization pages
✅ /companies/stellar-ai
✅ /companies/stellar-ai/about
```

**Benefits:**

- More RESTful
- Cleaner URLs (no ID prefix needed)
- Hierarchical structure (org → jobs)
- Slug only needs to be unique within org (already planned!)
- Easier to understand and share

### Complete Route Map

```
Public Routes:
├── /                                          # Job listings (homepage)
├── /companies/[companySlug]                   # Organization profile
├── /companies/[companySlug]/jobs/[jobSlug]    # Job detail
├── /search                                    # Full-text search results
│
Auth Routes (better-auth-ui-svelte):
├── /signup                                    # Signup choice page (talent vs recruiter)
├── /auth/sign-up                              # Signup form (with userType param)
├── /auth/sign-in                              # Login form
├── /auth/forgot-password                      # Password reset request
├── /auth/reset-password                       # New password entry
├── /auth/callback                             # OAuth callback handler
│
Onboarding Routes:
├── /onboarding/talent                         # Talent onboarding flow
├── /onboarding/recruit                        # Recruiter onboarding flow
│
Talent Dashboard:
├── /dashboard/talent                          # Talent dashboard
├── /dashboard/talent/applications             # Application history
├── /dashboard/talent/saved                    # Saved jobs
├── /dashboard/talent/profile                  # Profile settings
├── /dashboard/talent/become-recruiter         # Upgrade to recruiter
│
Recruiter Dashboard:
├── /dashboard/recruiter                       # Recruiter dashboard
├── /dashboard/recruiter/jobs                  # Manage jobs
├── /dashboard/recruiter/jobs/new              # Post new job
├── /dashboard/recruiter/jobs/[id]/edit        # Edit job
├── /dashboard/recruiter/organizations         # Manage organizations
├── /dashboard/recruiter/analytics             # Job analytics
├── /dashboard/recruiter/become-talent         # Add talent profile
│
Admin Routes:
├── /admin                                     # Admin dashboard
├── /admin/jobs                                # Review jobs
├── /admin/jobs/[id]                           # Job review detail
├── /admin/scrape                              # AI job scraper
├── /admin/organizations                       # Manage organizations
├── /admin/users                               # Manage users
│
API Routes:
├── /api/auth/[...auth]                        # Better Auth
├── /api/webhooks/payments                     # Payment webhooks
├── /api/webhooks/workflow                     # Workflow webhooks
```

---

## User Types & State Management

### User State Detection

```typescript
// src/lib/features/users/types.ts
export type UserState = 'talent' | 'recruiter';

export interface UserProfile {
	state: UserState;
	talentProfile: TalentProfile | null;
	recruiterProfile: RecruiterProfile | null;
	organizations: Organization[];
}

// src/lib/features/users/utils.ts
export function getUserState(
	talentProfile: TalentProfile | null,
	recruiterProfile: RecruiterProfile | null
): UserState {
	const hasTalent = !!talentProfile;
	const hasRecruiter = !!recruiterProfile;

	if (hasTalent && !hasRecruiter) return 'talent';
	if (!hasTalent && hasRecruiter) return 'recruiter';

	throw new Error('User must have either talent or recruiter profile' );
}
```

### Layout Load Function

```typescript
// src/routes/(app)/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { talentProfileRepository } from '$lib/features/talent/server/repository';
import { recruiterProfileRepository } from '$lib/features/recruiters/server/repository';
import { organizationRepository } from '$lib/features/organizations/server/repository';
import { getUserState } from '$lib/features/users/utils';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return {
			user: null,
			userProfile: null
		};
	}

	// Fetch all profile data in parallel
	const [talentProfile, recruiterProfile, organizations] = await Promise.all([
		talentProfileRepository.findByUserId(user.id),
		recruiterProfileRepository.findByUserId(user.id),
		organizationRepository.findByUserId(user.id)
	]);

	const userState = getUserState(talentProfile, recruiterProfile);

	return {
		user,
		userProfile: {
			state: userState,
			talentProfile,
			recruiterProfile,
			organizations
		}
	};
};
```

### Navigation Component

```svelte
<!-- src/lib/components/app-nav.svelte -->
<script lang="ts">
	import type { UserProfile } from '$lib/features/users/types';
	import { authClient } from '$lib/auth-client';

	interface Props {
		userProfile: UserProfile | null;
	}

	let { userProfile }: Props = $props();

	async function handleSignOut() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

<nav>
	<a href="/">Browse Jobs</a>

	{#if !userProfile}
		<a href="/signup">Sign Up</a>
		<a href="/auth/sign-in">Log In</a>
	{:else if userProfile.state === 'talent'}
		<a href="/dashboard/talent">Dashboard</a>
		<a href="/dashboard/talent/saved">Saved Jobs</a>
		<a href="/dashboard/talent/applications">Applications</a>
		<button onclick={handleSignOut}>Sign Out</button>
	{:else if userProfile.state === 'recruiter'}
		<a href="/dashboard/recruiter">Dashboard</a>
		<a href="/dashboard/recruiter/jobs/new">Post Job</a>
		<a href="/dashboard/recruiter/jobs">My Jobs</a>
		<button onclick={handleSignOut}>Sign Out</button>
	{:else if userProfile.state === 'both'}
		<!-- Mode switcher -->
		<ModeSwitch {userProfile} />
		<button onclick={handleSignOut}>Sign Out</button>
	{/if}
</nav>
```

---

## Authentication & Signup Flow

### Overview

We use **better-auth-ui-svelte** for all authentication flows, which provides pre-built, production-ready components with full Better Auth integration. The library handles the complete authentication cycle including signup, login, password reset, and more.

**Key Benefits:**

- ✅ **No +page.server.ts needed** - All auth logic handled by better-auth-ui-svelte
- ✅ Pre-built UI components (no custom forms needed)
- ✅ Automatic session management via Better Auth
- ✅ Built-in validation and error handling
- ✅ Support for additional fields (custom user type selection)
- ✅ Automatic redirect handling via `callbackUrl`
- ✅ Single catch-all route (`/auth/[path]`) for all auth pages

**What Changed from Traditional Approach:**

- ❌ **OLD**: Separate routes with +page.server.ts for each auth flow (signup/talent, signup/recruit, login)
- ✅ **NEW**: Single `/auth/[path]/+page.svelte` using better-auth-ui-svelte components
- ❌ **OLD**: Manual form actions, validation, session management
- ✅ **NEW**: Everything handled automatically by the library
- ❌ **OLD**: Create profiles in form actions
- ✅ **NEW**: Create profiles via Better Auth hooks after signup

### Route Structure

All auth routes use a single catch-all route pattern:

```
src/routes/auth/[path]/+page.svelte
```

This handles all auth paths:

- `/auth/sign-in` - Login
- `/auth/sign-up` - Signup with user type selection
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - New password entry
- `/auth/callback` - OAuth callback handler

### Better Auth Configuration

```typescript
// src/lib/server/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { db } from './db/client';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false // Set to true in production
	},
	plugins: [
		organization({
			// Organization plugin for company management
			async sendInvitationEmail(data) {
				// Send invitation via Bento
			}
		})
	],
	// Hook to create profile after signup
	hooks: {
		after: [
			{
				matcher: (context) => context.method === 'signUp.email',
				handler: async (context) => {
					const { user, request } = context;

					// Get user type from additional field
					const body = await request.json();
					const userType = body.userType; // 'talent' or 'recruiter'

					if (userType === 'talent') {
						await talentProfileRepository.create({
							userId: user.id,
							onboardingCompleted: false,
							onboardingStep: 0
						});
					} else if (userType === 'recruiter') {
						await recruiterProfileRepository.create({
							userId: user.id,
							onboardingCompleted: false,
							onboardingStep: 0
						});
					}
				}
			}
		]
	}
});
```

### Signup Landing Page

Landing page to choose between talent and recruiter signup:

```svelte
<!-- src/routes/signup/+page.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
</script>

<div class="container mx-auto px-4 py-16">
	<div class="mx-auto max-w-4xl text-center">
		<h1 class="mb-4 text-5xl font-bold">Sign up to JobBoardStarter</h1>
		<p class="mb-12 text-xl text-muted-foreground">Choose how you want to get started</p>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<!-- Talent Option -->
			<Card class="p-8 transition-colors hover:border-primary">
				<div class="mb-4 text-6xl">🔍</div>
				<h2 class="mb-3 text-2xl font-semibold">I'm looking for a job</h2>
				<p class="mb-6 text-muted-foreground">
					Get matched with jobs for free. Save listings, track applications, and discover
					opportunities from top companies.
				</p>
				<Button
					href="/auth/sign-up?userType=talent&callbackUrl=/onboarding/talent"
					size="lg"
					class="w-full"
				>
					Find Jobs →
				</Button>
			</Card>

			<!-- Recruiter Option -->
			<Card class="p-8 transition-colors hover:border-primary">
				<div class="mb-4 text-6xl">🏢</div>
				<h2 class="mb-3 text-2xl font-semibold">I'm hiring</h2>
				<p class="mb-6 text-muted-foreground">
					Connect with top talent. Post jobs, manage applications, and build your team with
					qualified candidates.
				</p>
				<Button
					href="/auth/sign-up?userType=recruiter&callbackUrl=/onboarding/recruit"
					size="lg"
					class="w-full"
					variant="secondary"
				>
					Post Jobs →
				</Button>
			</Card>
		</div>

		<p class="mt-8 text-sm text-muted-foreground">
			Already have an account? <a href="/auth/sign-in" class="text-primary hover:underline"
				>Log in</a
			>
		</p>
	</div>
</div>
```

### Auth UI Route (Catch-All)

Single route that handles all authentication pages using better-auth-ui-svelte:

```svelte
<!-- src/routes/auth/[path]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import {
		SignInForm,
		SignUpForm,
		ForgotPasswordForm,
		ResetPasswordForm
	} from 'better-auth-ui-svelte';
	import { authClient } from '$lib/auth-client';

	const path = $page.params.path;
	const userType = $page.url.searchParams.get('userType');
	const callbackUrl = $page.url.searchParams.get('callbackUrl') || '/';

	// Additional field for user type selection during signup
	const additionalFields = userType
		? [
				{
					label: 'User Type',
					type: 'hidden' as const,
					placeholder: userType,
					required: true,
					// This field will be sent with signup request
					validate: async (value: string) => {
						return ['talent', 'recruiter'].includes(value);
					}
				}
			]
		: [];
</script>

<div class="container mx-auto flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-md">
		{#if path === 'sign-in'}
			<SignInForm client={authClient} {callbackUrl} />
		{:else if path === 'sign-up'}
			<SignUpForm client={authClient} {callbackUrl} {additionalFields} />
		{:else if path === 'forgot-password'}
			<ForgotPasswordForm client={authClient} />
		{:else if path === 'reset-password'}
			<ResetPasswordForm client={authClient} />
		{:else}
			<p class="text-center text-muted-foreground">Page not found</p>
		{/if}
	</div>
</div>
```

### Auth Client Setup

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
	baseURL: '/api/auth' // Better Auth API endpoint
});

// Export hooks for components
export const { signIn, signUp, signOut, useSession } = authClient;
```

### Better Auth API Route

```typescript
// src/routes/api/auth/[...auth]/+server.ts
import { auth } from '$lib/server/auth';

export const GET = auth.handler;
export const POST = auth.handler;
```

### Session Management (hooks.server.ts)

```typescript
// src/hooks.server.ts
import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session from Better Auth
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.user = session.user;
		event.locals.session = session.session;
	}

	return resolve(event);
};
```

---

### Quick Reference: Auth Flow

**Visual Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User visits /signup                                           │
│    Sees two options: "Find Jobs" (talent) or "Post Jobs" (rec)  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. User clicks "Find Jobs"                                       │
│    Redirects to: /auth/sign-up?userType=talent&                 │
│                  callbackUrl=/onboarding/talent                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. better-auth-ui-svelte renders SignUpForm                      │
│    - Displays email, password, name fields                       │
│    - Hidden field: userType=talent                               │
│    - Validates & submits to Better Auth API                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Better Auth processes signup                                  │
│    a) Creates user in database                                   │
│    b) Fires hook: signUp.email                                   │
│    c) Hook creates talent_profile                                │
│    d) Sets session cookie                                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. User redirected to /onboarding/talent                         │
│    Session is active, profile exists, ready for onboarding!      │
└─────────────────────────────────────────────────────────────────┘
```

**Files you need to create:**

```
✅ src/lib/server/auth.ts (Better Auth config with hooks)
✅ src/lib/auth-client.ts (Client-side auth helper)
✅ src/routes/signup/+page.svelte (Choice page)
✅ src/routes/auth/[path]/+page.svelte (Catch-all auth route)
✅ src/routes/api/auth/[...auth]/+server.ts (Better Auth API)
✅ src/hooks.server.ts (Session management)

❌ NO +page.server.ts files needed in auth routes!
❌ NO custom form actions needed!
❌ NO manual session management!
```

### Talent Onboarding Flow

```svelte
<!-- src/routes/(app)/onboarding/talent/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { updateTalentProfileAction } from './+page.server';

	let step = $state(1);
	let formData = $state({
		headline: '',
		location: '',
		desiredJobTypes: [],
		desiredLocationTypes: [],
		yearsOfExperience: null,
		skills: []
	});

	async function handleComplete() {
		await updateTalentProfileAction({
			...formData,
			onboardingCompleted: true
		});
		goto('/dashboard/talent');
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mx-auto max-w-2xl">
		<!-- Progress bar -->
		<div class="mb-8">
			<div class="mb-2 flex justify-between">
				<span>Step {step} of 5</span>
			</div>
			<div class="h-2 rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-primary transition-all"
					style="width: {step * 20}%"
				></div>
			</div>
		</div>

		{#if step === 1}
			<h2 class="mb-4 text-3xl font-bold">What type of role are you looking for?</h2>
			<!-- Job type selection -->
		{:else if step === 2}
			<h2 class="mb-4 text-3xl font-bold">Where do you want to work?</h2>
			<!-- Location type selection -->
		{:else if step === 3}
			<h2 class="mb-4 text-3xl font-bold">What's your experience level?</h2>
			<!-- Years of experience -->
		{:else if step === 4}
			<h2 class="mb-4 text-3xl font-bold">What are your top skills?</h2>
			<!-- Skills input -->
		{:else if step === 5}
			<h2 class="mb-4 text-3xl font-bold">Almost done!</h2>
			<!-- Summary + optional resume upload -->
		{/if}

		<div class="mt-8 flex justify-between">
			{#if step > 1}
				<Button variant="outline" onclick={() => step--}>Back</Button>
			{/if}

			{#if step < 5}
				<Button onclick={() => step++}>Next</Button>
			{:else}
				<Button onclick={handleComplete}>Complete Setup</Button>
			{/if}
		</div>

		<button
			class="mt-4 text-sm text-muted-foreground hover:underline"
			onclick={() => goto('/dashboard/talent')}
		>
			Skip for now
		</button>
	</div>
</div>
```

### Recruiter Onboarding Flow

The recruiter onboarding is a 3-step process with email verification:

**Step 1: Find Company** (`/onboarding/recruit/find-company`)

- Search for existing companies
- No API call yet (just search)
- Option to create if not found

**Step 2: Verify Email** (`/onboarding/recruit/verify-email`)

- User enters work email prefix (e.g., `chris`)
- System shows domain (e.g., `@productbird.ai`)
- Smart verification:
  - If email already exists as member → auto-verify (skip email)
  - Otherwise → send verification email
- CTAs: "Send email" or "Change company" (back to step 1)

**Step 3: Invite Team** (`/onboarding/recruit/invite-team`)

- Success message: "You've been added to [Company]"
- Multi-email invite form
- "Send invite" or "Skip for now"

#### Step 1: Find Company

```svelte
<!-- src/routes/(app)/onboarding/recruit/find-company/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { searchOrganizationsCommand } from '$lib/features/organizations/server/organizations.remote';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

	let searchQuery = $state('');
	let searchResults = $state([]);
	let isSearching = $state(false);
	let selectedOrg = $state(null);
	let showCreateForm = $state(false);
	let newOrgData = $state({
		name: '',
		websiteUrl: ''
	});

	async function handleSearch() {
		if (!searchQuery) return;

		isSearching = true;
		try {
			searchResults = await searchOrganizationsCommand(searchQuery);
		} finally {
			isSearching = false;
		}
	}

	function selectOrganization(org) {
		selectedOrg = org;
		// Store in session or pass via URL
		goto(`/onboarding/recruit/verify-email?orgId=${org.id}`);
	}

	function createNewOrganization() {
		// Store pending org data in session
		sessionStorage.setItem('pendingOrg', JSON.stringify(newOrgData));
		goto(`/onboarding/recruit/verify-email?create=true`);
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="mb-2 text-3xl font-bold">Find your company</h1>
	<p class="mb-8 text-gray-600">
		There are a lot of companies already on JobBoardStarter. Please search for yours. If you can't
		find it, you'll be able to create one.
	</p>

	<!-- Search Box -->
	<div class="mb-6">
		<div class="flex gap-3">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search for your company..."
				class="flex-1 rounded-lg border px-4 py-3"
				onkeydown={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<Button onclick={handleSearch} disabled={isSearching || !searchQuery}>
				{isSearching ? 'Searching...' : 'Search'}
			</Button>
		</div>
	</div>

	<!-- Search Results -->
	{#if searchResults.length > 0}
		<div class="mb-8 space-y-3">
			<p class="text-sm text-gray-600">Found {searchResults.length} companies:</p>
			{#each searchResults as org}
				<button
					onclick={() => selectOrganization(org)}
					class="w-full rounded-lg border p-4 text-left transition-colors hover:border-blue-500 hover:bg-blue-50"
				>
					<div class="flex items-center gap-3">
						{#if org.logo}
							<img src={org.logo} alt={org.name} class="h-12 w-12 rounded" />
						{:else}
							<div class="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
								<span class="text-xl font-bold text-gray-500">
									{org.name.charAt(0)}
								</span>
							</div>
						{/if}
						<div>
							<div class="font-semibold">{org.name}</div>
							{#if org.metadata?.websiteUrl}
								<div class="text-sm text-gray-500">{org.metadata.websiteUrl}</div>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Can't Find Company -->
	<div class="border-t pt-8">
		<p class="mb-4 text-sm text-gray-600">Can't find your company?</p>

		{#if !showCreateForm}
			<Button onclick={() => (showCreateForm = true)} variant="outline">
				Create a new company
			</Button>
		{:else}
			<div class="space-y-4">
				<div>
					<label class="mb-2 block text-sm font-medium">Company name*</label>
					<input
						type="text"
						bind:value={newOrgData.name}
						placeholder="e.g. Productbird"
						class="w-full rounded-lg border px-4 py-2"
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium">Company website*</label>
					<input
						type="url"
						bind:value={newOrgData.websiteUrl}
						placeholder="e.g. https://productbird.ai"
						class="w-full rounded-lg border px-4 py-2"
					/>
				</div>

				<div class="flex gap-3">
					<Button onclick={() => (showCreateForm = false)} variant="outline">Cancel</Button>
					<Button
						onclick={createNewOrganization}
						disabled={!newOrgData.name || !newOrgData.websiteUrl}
					>
						Continue
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
```

#### Step 2: Verify Email

```svelte
<!-- src/routes/(app)/onboarding/recruit/verify-email/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { verifyWorkEmailCommand } from '$lib/features/organizations/server/organizations.remote';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

	// Get org from step 1
	const orgId = $page.url.searchParams.get('orgId');
	const isCreating = $page.url.searchParams.get('create') === 'true';

	let organization = data.organization; // Loaded in +page.server.ts
	let emailPrefix = $state('');
	let isVerifying = $state(false);
	let verificationSent = $state(false);
	let errorMessage = $state('');

	// Extract domain from organization
	const domain = organization?.metadata?.websiteUrl
		? new URL(organization.metadata.websiteUrl).hostname.replace('www.', '')
		: '';

	async function handleVerifyEmail() {
		if (!emailPrefix) return;

		const fullEmail = `${emailPrefix}@${domain}`;
		isVerifying = true;
		errorMessage = '';

		try {
			const result = await verifyWorkEmailCommand({
				email: fullEmail,
				organizationId: orgId,
				isCreating,
				pendingOrgData: isCreating ? JSON.parse(sessionStorage.getItem('pendingOrg') || '{}') : null
			});

			if (result.autoVerified) {
				// User already exists as member → skip email verification
				goto('/onboarding/recruit/invite-team');
			} else {
				// Verification email sent
				verificationSent = true;
			}
		} catch (err) {
			errorMessage = err.message || 'Failed to verify email. Please try again.';
		} finally {
			isVerifying = false;
		}
	}

	function changeCompany() {
		goto('/onboarding/recruit/find-company');
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="mb-2 text-3xl font-bold">Confirm your {domain} email</h1>
	<p class="mb-8 text-gray-600">
		To ensure job seekers only interact with real employees, we need to confirm that you work there.
	</p>

	{#if !verificationSent}
		<!-- Email Input -->
		<div class="mb-6">
			<label class="mb-2 block text-sm font-medium">Work email*</label>
			<div class="flex items-center gap-2">
				<input
					type="text"
					bind:value={emailPrefix}
					placeholder="chris"
					class="flex-1 rounded-lg border px-4 py-3"
					onkeydown={(e) => e.key === 'Enter' && handleVerifyEmail()}
				/>
				<span class="text-lg text-gray-600">@{domain}</span>
			</div>

			{#if errorMessage}
				<p class="mt-2 text-sm text-red-600">{errorMessage}</p>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex gap-3">
			<Button onclick={handleVerifyEmail} disabled={isVerifying || !emailPrefix} class="flex-1">
				{isVerifying ? 'Verifying...' : 'Send email'}
			</Button>
			<Button onclick={changeCompany} variant="outline">Change company</Button>
		</div>
	{:else}
		<!-- Verification Email Sent -->
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
			<h3 class="mb-2 font-semibold">Verification email sent!</h3>
			<p class="text-sm text-gray-600">
				We've sent a verification link to <strong>{emailPrefix}@{domain}</strong>. Please check your
				inbox and click the link to continue.
			</p>
		</div>

		<div class="mt-6">
			<Button onclick={changeCompany} variant="outline">Change company</Button>
		</div>
	{/if}
</div>
```

#### Step 3: Invite Team

```svelte
<!-- src/routes/(app)/onboarding/recruit/invite-team/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { inviteTeamMembersCommand } from '$lib/features/organizations/server/organizations.remote';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	let organization = data.organization;

	let inviteEmails = $state(['', '']);
	let isSending = $state(false);

	function addAnotherEmail() {
		inviteEmails = [...inviteEmails, ''];
	}

	function removeEmail(index: number) {
		inviteEmails = inviteEmails.filter((_, i) => i !== index);
	}

	async function handleSendInvites() {
		const validEmails = inviteEmails.filter((e) => e.trim() && e.includes('@'));

		if (validEmails.length === 0) {
			goto('/dashboard/recruiter');
			return;
		}

		isSending = true;
		try {
			await inviteTeamMembersCommand({
				organizationId: organization.id,
				emails: validEmails,
				role: 'job_editor' // Default role for invited team members
			});
			goto('/dashboard/recruiter');
		} finally {
			isSending = false;
		}
	}

	function skipForNow() {
		goto('/dashboard/recruiter');
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-12">
	<!-- Success Message -->
	<div class="mb-8 rounded-lg border border-green-200 bg-green-50 p-6">
		<div class="flex items-start gap-3">
			<svg class="mt-1 h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				/>
			</svg>
			<div>
				<h2 class="mb-1 text-xl font-semibold text-green-900">
					You've been added to {organization.name}
				</h2>
				<p class="text-sm text-green-700">
					You can invite your co-workers to manage your company profile, post jobs, and review
					candidates for free.
				</p>
			</div>
		</div>
	</div>

	<!-- Invite Form -->
	<div class="mb-8">
		<h3 class="mb-4 text-lg font-semibold">Invite co-workers to your team</h3>

		<div class="space-y-3">
			{#each inviteEmails as email, i}
				<div class="flex gap-2">
					<input
						type="email"
						bind:value={inviteEmails[i]}
						placeholder="user@{organization.metadata?.websiteUrl
							? new URL(organization.metadata.websiteUrl).hostname.replace('www.', '')
							: 'company.com'}"
						class="flex-1 rounded-lg border px-4 py-2"
					/>
					{#if inviteEmails.length > 2}
						<button
							onclick={() => removeEmail(i)}
							class="px-3 py-2 text-gray-600 hover:text-red-600"
						>
							Remove
						</button>
					{/if}
				</div>
			{/each}

			<button
				onclick={addAnotherEmail}
				class="text-sm font-medium text-blue-600 hover:text-blue-700"
			>
				+ Add another
			</button>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex gap-3">
		<Button onclick={skipForNow} variant="outline" class="flex-1">Skip for now</Button>
		<Button onclick={handleSendInvites} disabled={isSending} class="flex-1">
			{isSending ? 'Sending invites...' : 'Send invites'}
		</Button>
	</div>
</div>
```

#### Server-Side Logic

```typescript
// src/lib/features/organizations/server/mutations.ts

/**
 * Verify work email and add user to organization
 * Smart logic:
 * - If user email already exists as member → auto-verify
 * - Otherwise → send verification email
 */
export async function verifyWorkEmail({
	email,
	organizationId,
	isCreating,
	pendingOrgData,
	userId
}: {
	email: string;
	organizationId?: string;
	isCreating: boolean;
	pendingOrgData?: { name: string; websiteUrl: string };
	userId: string;
}) {
	let org;

	// Create organization if needed
	if (isCreating && pendingOrgData) {
		const slug = await generateUniqueOrgSlug(pendingOrgData.name);
		const emailDomain = email.split('@')[1];

		org = await auth.api.createOrganization({
			body: {
				name: pendingOrgData.name,
				slug,
				metadata: {
					websiteUrl: pendingOrgData.websiteUrl,
					emailDomain,
					verified: false
				}
			}
		});
	} else {
		org = await organizationRepository.findById(organizationId);
	}

	if (!org) throw new AppError('Organization not found', 404);

	// Check if user already exists as member
	const existingMember = await memberRepository.findByUserAndOrg(userId, org.id);

	if (existingMember) {
		// Auto-verify: user already a member
		return { autoVerified: true, organization: org };
	}

	// Check if email domain matches organization
	const emailDomain = email.split('@')[1];
	const orgDomain = org.metadata?.websiteUrl
		? new URL(org.metadata.websiteUrl).hostname.replace('www.', '')
		: null;

	if (orgDomain && emailDomain !== orgDomain) {
		throw new AppError('Email domain does not match organization', 403);
	}

	// Send verification email
	await sendVerificationEmail({
		email,
		organizationId: org.id,
		organizationName: org.name
	});

	return { autoVerified: false, emailSent: true };
}

/**
 * Send verification email with magic link
 */
async function sendVerificationEmail({
	email,
	organizationId,
	organizationName
}: {
	email: string;
	organizationId: string;
	organizationName: string;
}) {
	// Generate verification token
	const token = generateVerificationToken({ email, organizationId });

	// Send email via Bento
	await sendTransactionalEmail(email, 'verify-work-email', {
		organizationName,
		verificationUrl: `${env.PUBLIC_BASE_URL}/verify-email?token=${token}`
	});
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure ✅

**Goal**: Set up foundation with updated schema and URL structure

1. **Database Setup**
   - [ ] Create schema files:
     - `src/lib/server/db/schema/talent-profiles.ts`
     - `src/lib/server/db/schema/recruiter-profiles.ts`
     - `src/lib/server/db/schema/saved-jobs.ts`
     - `src/lib/server/db/schema/job-applications.ts`
     - `src/lib/server/db/schema/jobs.ts` (update existing)
     - `src/lib/server/db/schema/payments.ts` (update existing)
   - [ ] Run migrations: `pnpm run db:generate && pnpm run db:push`

2. **Better Auth Configuration**
   - [ ] Set up Better Auth with organization plugin
   - [ ] Configure email/password auth
   - [ ] Set up role-based permissions
   - [ ] Create hooks.server.ts for session handling

3. **Route Structure**
   - [ ] Create new route folders:
     - `src/routes/(app)/companies/[companySlug]/+page.svelte`
     - `src/routes/(app)/companies/[companySlug]/jobs/[jobSlug]/+page.svelte`
     - `src/routes/(auth)/signup/+page.svelte`
     - `src/routes/(auth)/signup/talent/+page.svelte`
     - `src/routes/(auth)/signup/recruit/+page.svelte`
   - [ ] Update slug generation utilities

4. **User State Management**
   - [ ] Create `src/lib/features/users/types.ts`
   - [ ] Create `src/lib/features/users/utils.ts` (getUserState)
   - [ ] Update app layout load function

**Acceptance Criteria:**

- ✅ Database schema matches new design
- ✅ Better Auth working with organizations
- ✅ New URL structure works: `/companies/{slug}/jobs/{slug}`
- ✅ User state detection working in layout

---

### Phase 2: Authentication & Signup Flow ✅

**Goal**: Complete signup and onboarding for both user types using better-auth-ui-svelte

5. **Better Auth Setup**
   - [ ] Install better-auth-ui-svelte: `pnpm add better-auth-ui-svelte better-auth`
   - [ ] Configure Better Auth with Drizzle adapter (`src/lib/server/auth.ts`)
   - [ ] Add organization plugin for company management
   - [ ] Create Better Auth API route (`src/routes/api/auth/[...auth]/+server.ts`)
   - [ ] Set up hooks.server.ts for session management
   - [ ] Create auth client (`src/lib/auth-client.ts`)

6. **Auth Routes (No +page.server.ts needed!)**
   - [ ] Build `/signup/+page.svelte` - Landing page with talent/recruiter choice
   - [ ] Build `/auth/[path]/+page.svelte` - Single catch-all route using better-auth-ui-svelte
   - [ ] Configure additional fields for user type selection
   - [ ] Set up Better Auth hooks to create profiles after signup

7. **Profile Repositories**
   - [ ] Create `talent-profiles` repository (CRUD)
   - [ ] Create `recruiter-profiles` repository (CRUD)
   - [ ] Add validators for profile data
   - [ ] Integrate with Better Auth signup hook

8. **Onboarding Flows**
   - [ ] Build `/onboarding/talent` multi-step form
   - [ ] Build `/onboarding/recruit` multi-step form
   - [ ] Add skip functionality
   - [ ] Add progress tracking

9. **Navigation**
   - [ ] Create navigation component with user state branching
   - [ ] Add sign out functionality using authClient
   - [ ] Add persistent onboarding reminder banner
   - [ ] Handle "both" user types (if any exist)

**Acceptance Criteria:**

- ✅ Users can sign up as talent or recruiter via better-auth-ui-svelte
- ✅ Profiles are created automatically via Better Auth hooks
- ✅ No custom form validation needed (handled by library)
- ✅ Onboarding flows work end-to-end
- ✅ Navigation shows correct links based on user type
- ✅ Session management works via Better Auth

---

### Phase 3: Jobs Feature (Core) ✅

**Goal**: Basic job posting, listing, and detail pages

9. **Job Repositories & Mutations**
   - [ ] Update job repository for new URL structure
   - [ ] Add slug generation for `/companies/{org}/jobs/{job}`
   - [ ] Add job CRUD mutations
   - [ ] Add permission checks (org membership)

10. **Job Listing & Detail Pages**
    - [ ] Update homepage (`/`) to show jobs
    - [ ] Build `/companies/[companySlug]/+page.svelte` (org profile)
    - [ ] Build `/companies/[companySlug]/jobs/[jobSlug]/+page.svelte` (job detail)
    - [ ] Add filters and search

11. **Job Posting Flow (Recruiter)**
    - [ ] Build `/dashboard/recruiter/jobs/new/+page.svelte`
    - [ ] Add Tiptap rich text editor
    - [ ] Add organization selector
    - [ ] Connect to payment flow

**Acceptance Criteria:**

- ✅ Jobs display on homepage
- ✅ Job detail pages work with new URLs
- ✅ Organization pages show all their jobs
- ✅ Recruiters can post jobs

---

### Phase 4: Talent Features ✅

**Goal**: Saved jobs, application tracking, talent dashboard

12. **Saved Jobs**
    - [ ] Create saved-jobs repository
    - [ ] Add "Save Job" button to job cards
    - [ ] Build `/dashboard/talent/saved/+page.svelte`
    - [ ] Add remove functionality

13. **Application Tracking**
    - [ ] Create job-applications repository
    - [ ] Build application modal with 3-stage tracking
    - [ ] Track: modal_shown → cta_clicked → external_opened
    - [ ] Build `/dashboard/talent/applications/+page.svelte`

14. **Talent Dashboard**
    - [ ] Build `/dashboard/talent/+page.svelte` (overview)
    - [ ] Show recent applications
    - [ ] Show saved jobs
    - [ ] Show personalized job recommendations

15. **Talent Profile**
    - [ ] Build `/dashboard/talent/profile/+page.svelte`
    - [ ] Add profile editing form
    - [ ] Add resume upload
    - [ ] Add skill management

**Acceptance Criteria:**

- ✅ Talent can save jobs
- ✅ Application tracking works (3 stages)
- ✅ Dashboard shows relevant data
- ✅ Profile is editable

---

### Phase 5: Recruiter Features ✅

**Goal**: Job management, analytics, organization management

16. **Recruiter Dashboard**
    - [ ] Build `/dashboard/recruiter/+page.svelte`
    - [ ] Show job statistics
    - [ ] Show recent applications
    - [ ] Show pending approvals

17. **Job Management**
    - [ ] Build `/dashboard/recruiter/jobs/+page.svelte` (list)
    - [ ] Build `/dashboard/recruiter/jobs/[id]/edit/+page.svelte`
    - [ ] Add job status indicators
    - [ ] Add duplicate job functionality

18. **Job Analytics**
    - [ ] Build `/dashboard/recruiter/analytics/+page.svelte`
    - [ ] Show views, clicks, applications per job
    - [ ] Add date range filtering
    - [ ] Add export functionality

19. **Organization Management**
    - [ ] Build `/dashboard/recruiter/organizations/+page.svelte`
    - [ ] Add member invitation UI
    - [ ] Add role management
    - [ ] Show organization jobs

**Acceptance Criteria:**

- ✅ Recruiters can manage all their jobs
- ✅ Analytics show real data
- ✅ Organizations can be managed
- ✅ Members can be invited

---

### Phase 6: Payments & Admin ✅

**Goal**: Payment flow, admin approval, AI scraping

20. **Payment System**
    - [ ] Implement DodoPayments provider
    - [ ] Build `/payment/checkout/[jobId]/+page.svelte`
    - [ ] Add upgrade selection (newsletter, extended duration)
    - [ ] Handle payment webhooks
    - [ ] Build success/failure pages

21. **Admin Panel**
    - [ ] Build `/admin/+page.svelte` (dashboard)
    - [ ] Build `/admin/jobs/+page.svelte` (review queue)
    - [ ] Add approve/reject actions
    - [ ] Show admin action logs

22. **AI Job Scraper**
    - [ ] Integrate AI SDK (OpenAI)
    - [ ] Build `/admin/scrape/+page.svelte`
    - [ ] Add URL scraping functionality
    - [ ] Pre-fill job form with scraped data

23. **Job Lifecycle & Notifications**
    - [ ] Set up Workflow client
    - [ ] Set up Bento for emails
    - [ ] Add fan-out events:
      - job.paid → confirmation email
      - job.approved → publisher + org emails + newsletter
      - job.expired → renewal reminder
    - [ ] Add cron job for expiring jobs

**Acceptance Criteria:**

- ✅ Payment flow works end-to-end
- ✅ Admins can approve/reject jobs
- ✅ AI scraper extracts job data accurately
- ✅ Email notifications are sent

---

### Phase 7: Advanced Features ✅

**Goal**: Profile switching, search, SEO, polish

24. **Profile Switching ("Both" Users)**
    - [ ] Add "Become a Recruiter" to talent dashboard
    - [ ] Add "Add Talent Profile" to recruiter dashboard
    - [ ] Build mode switcher component
    - [ ] Handle dual dashboard access

25. **Full-Text Search**
    - [ ] Implement PostgreSQL full-text search
    - [ ] Build `/search/+page.svelte`
    - [ ] Add search bar to nav
    - [ ] Add search filters

26. **SEO Optimization**
    - [ ] Add meta tags to job pages (following seo-architecture.md)
    - [ ] Add structured data (JobPosting schema.org)
    - [ ] Generate sitemap
    - [ ] Add Open Graph images

27. **Job Alerts (Email Notifications)**
    - [ ] Create job_alerts table (optional)
    - [ ] Add alert preferences to talent profile
    - [ ] Build cron job for matching alerts
    - [ ] Send email digests

28. **Polish & UX**
    - [ ] Add loading states
    - [ ] Add error handling
    - [ ] Add toast notifications
    - [ ] Responsive design testing
    - [ ] Accessibility audit

**Acceptance Criteria:**

- ✅ Users can switch between profiles
- ✅ Search works across all jobs
- ✅ SEO is optimized
- ✅ Job alerts are sent
- ✅ UI is polished and responsive

---

## Route Structure

### File System

```
src/routes/
├── (app)/
│   ├── +layout.svelte                           # Main app layout
│   ├── +layout.server.ts                        # User state detection
│   ├── +page.svelte                             # Homepage (job listings)
│   ├── +page.server.ts
│   │
│   ├── companies/
│   │   └── [companySlug]/
│   │       ├── +page.svelte                     # Organization profile
│   │       ├── +page.server.ts
│   │       └── jobs/
│   │           └── [jobSlug]/
│   │               ├── +page.svelte             # Job detail
│   │               └── +page.server.ts
│   │
│   ├── search/
│   │   ├── +page.svelte                         # Full-text search
│   │   └── +page.server.ts
│   │
│   ├── onboarding/
│   │   ├── talent/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.ts
│   │   └── recruit/
│   │       ├── +page.svelte
│   │       └── +page.server.ts
│   │
│   ├── dashboard/
│   │   ├── talent/
│   │   │   ├── +layout.svelte                   # Talent dashboard layout
│   │   │   ├── +layout.server.ts                # Check talent profile exists
│   │   │   ├── +page.svelte                     # Talent dashboard home
│   │   │   ├── +page.server.ts
│   │   │   ├── saved/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── applications/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── profile/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   └── become-recruiter/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   │
│   │   └── recruiter/
│   │       ├── +layout.svelte                   # Recruiter dashboard layout
│   │       ├── +layout.server.ts                # Check recruiter profile exists
│   │       ├── +page.svelte                     # Recruiter dashboard home
│   │       ├── +page.server.ts
│   │       ├── jobs/
│   │       │   ├── +page.svelte                 # Job list
│   │       │   ├── +page.server.ts
│   │       │   ├── new/
│   │       │   │   ├── +page.svelte             # Post new job
│   │       │   │   └── +page.server.ts
│   │       │   └── [id]/
│   │       │       └── edit/
│   │       │           ├── +page.svelte         # Edit job
│   │       │           └── +page.server.ts
│   │       ├── organizations/
│   │       │   ├── +page.svelte                 # Manage organizations
│   │       │   └── +page.server.ts
│   │       ├── analytics/
│   │       │   ├── +page.svelte                 # Job analytics
│   │       │   └── +page.server.ts
│   │       └── become-talent/
│   │           ├── +page.svelte
│   │           └── +page.server.ts
│   │
│   ├── payment/
│   │   ├── checkout/
│   │   │   └── [jobId]/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   └── success/
│   │       ├── +page.svelte
│   │       └── +page.server.ts
│   │
│   └── admin/
│       ├── +layout.svelte                       # Admin layout
│       ├── +layout.server.ts                    # Check admin role
│       ├── +page.svelte                         # Admin dashboard
│       ├── +page.server.ts
│       ├── jobs/
│       │   ├── +page.svelte                     # Review queue
│       │   ├── +page.server.ts
│       │   └── [id]/
│       │       ├── +page.svelte                 # Job review detail
│       │       └── +page.server.ts
│       ├── scrape/
│       │   ├── +page.svelte                     # AI scraper
│       │   └── +page.server.ts
│       ├── organizations/
│       │   ├── +page.svelte
│       │   └── +page.server.ts
│       └── users/
│           ├── +page.svelte
│           └── +page.server.ts
│
├── signup/
│   └── +page.svelte                             # Signup choice page (talent vs recruiter)
│
├── auth/
│   └── [path]/
│       └── +page.svelte                         # Catch-all auth route (better-auth-ui-svelte)
│                                                 # Handles: sign-in, sign-up, forgot-password, reset-password, callback
│
└── api/
    ├── auth/
    │   └── [...auth]/
    │       └── +server.ts                       # Better Auth API handler
    └── webhooks/
        ├── payments/
        │   └── +server.ts                       # DodoPayments webhooks
        └── workflow/
            └── +server.ts                       # Workflow webhooks
```

---

## Repository Patterns

### Talent Profile Repository

```typescript
// src/lib/features/talent/server/repository.ts
import { db } from '$lib/server/db/client';
import { talentProfiles } from '$lib/server/db/schema/talent-profiles';
import { eq } from 'drizzle-orm';
import type { TalentProfile, NewTalentProfile } from '../types';

export const talentProfileRepository = {
	async create(data: NewTalentProfile): Promise<TalentProfile> {
		const [profile] = await db.insert(talentProfiles).values(data).returning();
		return profile;
	},

	async findByUserId(userId: string): Promise<TalentProfile | null> {
		const [profile] = await db
			.select()
			.from(talentProfiles)
			.where(eq(talentProfiles.userId, userId))
			.limit(1);
		return profile ?? null;
	},

	async update(userId: string, data: Partial<TalentProfile>): Promise<TalentProfile> {
		const [profile] = await db
			.update(talentProfiles)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(talentProfiles.userId, userId))
			.returning();
		return profile;
	},

	async delete(userId: string): Promise<void> {
		await db.delete(talentProfiles).where(eq(talentProfiles.userId, userId));
	}
};
```

### Saved Jobs Repository

```typescript
// src/lib/features/talent/server/saved-jobs-repository.ts
import { db } from '$lib/server/db/client';
import { savedJobs } from '$lib/server/db/schema/saved-jobs';
import { jobs } from '$lib/server/db/schema/jobs';
import { organization } from '$lib/server/db/schema/auth';
import { eq, and, desc } from 'drizzle-orm';

export const savedJobsRepository = {
	async save(userId: string, jobId: number, notes?: string) {
		const [saved] = await db
			.insert(savedJobs)
			.values({ userId, jobId, notes })
			.onConflictDoNothing()
			.returning();
		return saved;
	},

	async unsave(userId: string, jobId: number) {
		await db.delete(savedJobs).where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)));
	},

	async findByUser(userId: string) {
		return db
			.select({
				savedJob: savedJobs,
				job: jobs,
				organization: organization
			})
			.from(savedJobs)
			.innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
			.innerJoin(organization, eq(jobs.organizationId, organization.id))
			.where(eq(savedJobs.userId, userId))
			.orderBy(desc(savedJobs.createdAt));
	},

	async isSaved(userId: string, jobId: number): Promise<boolean> {
		const [result] = await db
			.select()
			.from(savedJobs)
			.where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
			.limit(1);
		return !!result;
	}
};
```

### Job Repository (Updated for New URLs)

```typescript
// src/lib/features/jobs/server/repository.ts
import { db } from '$lib/server/db/client';
import { jobs } from '$lib/server/db/schema/jobs';
import { organization } from '$lib/server/db/schema/auth';
import { eq, and, sql } from 'drizzle-orm';
import type { Job, JobDetail } from '../types';

export const jobRepository = {
	/**
	 * Find job by organization slug and job slug
	 * Used for new URL structure: /companies/{orgSlug}/jobs/{jobSlug}
	 */
	async findByOrgAndJobSlug(orgSlug: string, jobSlug: string): Promise<JobDetail | null> {
		const [job] = await db
			.select({
				job: jobs,
				organization: organization
			})
			.from(jobs)
			.innerJoin(organization, eq(jobs.organizationId, organization.id))
			.where(
				and(eq(organization.slug, orgSlug), eq(jobs.slug, jobSlug), eq(jobs.status, 'published'))
			)
			.limit(1);

		return job ?? null;
	},

	/**
	 * Generate job URL from job and organization
	 */
	generateJobUrl(job: Job, org: { slug: string }): string {
		return `/companies/${org.slug}/jobs/${job.slug}`;
	},

	/**
	 * Check if slug is unique within organization
	 */
	async isSlugUniqueInOrg(orgId: string, slug: string): Promise<boolean> {
		const [existing] = await db
			.select()
			.from(jobs)
			.where(and(eq(jobs.organizationId, orgId), eq(jobs.slug, slug)))
			.limit(1);
		return !existing;
	}

	// ... other repository methods
};
```

### Slug Generation (Updated)

```typescript
// src/lib/server/utils/slug.ts
import slugify from 'slugify';

/**
 * Generate URL-safe slug from text
 */
export function generateSlug(text: string): string {
	return slugify(text, {
		lower: true,
		strict: true,
		trim: true
	});
}

/**
 * Generate unique job slug within organization
 */
export async function generateUniqueJobSlug(
	title: string,
	organizationId: string,
	repository: typeof jobRepository
): Promise<string> {
	let slug = generateSlug(title);
	let counter = 1;

	while (!(await repository.isSlugUniqueInOrg(organizationId, slug))) {
		slug = `${generateSlug(title)}-${counter}`;
		counter++;
	}

	return slug;
}

/**
 * Generate unique organization slug
 */
export async function generateUniqueOrgSlug(
	name: string,
	repository: typeof organizationRepository
): Promise<string> {
	let slug = generateSlug(name);
	let counter = 1;

	while (await repository.findBySlug(slug)) {
		slug = `${generateSlug(name)}-${counter}`;
		counter++;
	}

	return slug;
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/jobboard

# Better Auth (required for better-auth-ui-svelte)
BETTER_AUTH_SECRET=your-secret-key-min-32-chars  # Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5173            # Your app's base URL
PUBLIC_BETTER_AUTH_URL=http://localhost:5173     # Public-facing URL for client

# DodoPayments (Base currency: EUR)
DODO_API_KEY=your-dodo-api-key
DODO_WEBHOOK_SECRET=your-webhook-secret

# Workflow (Fan-out & Events)
WORKFLOW_API_KEY=your-workflow-api-key

# Bento (Email Delivery)
BENTO_SITE_UUID=your-bento-site-uuid
BENTO_PUBLISHABLE_KEY=your-bento-publishable-key
BENTO_SECRET_KEY=your-bento-secret-key

# AI SDK (OpenAI for Scraping)
OPENAI_API_KEY=your-openai-api-key

# Cloudflare Images (Optional)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_IMAGES_ACCOUNT_HASH=your-hash

# App
PUBLIC_BASE_URL=http://localhost:5173
NODE_ENV=development
```

---

## Testing Checklist

### Authentication Tests (better-auth-ui-svelte)

- [ ] Talent signup creates user + talent_profile via Better Auth hook
- [ ] Recruiter signup creates user + recruiter_profile via Better Auth hook
- [ ] Login works for both types using SignInForm component
- [ ] Session persists across page loads via Better Auth
- [ ] Sign out clears session via authClient.signOut()
- [ ] Password reset flow works via ForgotPasswordForm
- [ ] Additional field (userType) is correctly passed to Better Auth
- [ ] CallbackUrl redirects work after signup/login

### User State Tests

- [ ] Talent user has state: 'talent'
- [ ] Recruiter user has state: 'recruiter'
- [ ] Navigation shows correct links per state

### URL Structure Tests

- [ ] `/companies/stellar-ai/jobs/engineer` loads job correctly
- [ ] Job slug is unique within org (not globally)
- [ ] Organization page shows all jobs
- [ ] 404 for invalid org or job slug
- [ ] Redirect old URLs if needed

### Talent Flow Tests

- [ ] Can save jobs
- [ ] Can unsave jobs
- [ ] Application tracking records 3 stages
- [ ] Dashboard shows saved jobs
- [ ] Dashboard shows applications

### Recruiter Flow Tests

- [ ] Can post job
- [ ] Can edit own job
- [ ] Cannot edit other org's job
- [ ] Can manage organization members
- [ ] Analytics show correct data

### Payment Tests

- [ ] Payment creates checkout session
- [ ] Webhook updates job status
- [ ] Job moves to awaiting_approval after payment
- [ ] Upgrades are tracked

### Admin Tests

- [ ] Admin can approve jobs
- [ ] Admin can reject jobs
- [ ] AI scraper extracts job data
- [ ] Admin actions are logged

---

## Summary

This implementation plan provides a complete roadmap for building a dual-sided job board with:

✅ **Clean Architecture**

- Separate talent and recruiter profiles
- User state management system
- Better Auth for core auth + organizations
- **NEW**: better-auth-ui-svelte for zero-boilerplate authentication

✅ **Improved URL Structure**

- `/companies/{company}/jobs/{job}` (RESTful, clean)
- No ID prefix needed
- Slug unique within organization

✅ **Flexible User System**

- Users can be talent, recruiter, or both
- Lazy profile creation (only create what's needed)
- Mode switching for power users

✅ **Simplified Authentication Flow**

- **Single catch-all route** (`/auth/[path]`) for all auth pages
- **No +page.server.ts needed** - all handled by better-auth-ui-svelte
- Pre-built components: SignInForm, SignUpForm, ForgotPasswordForm, etc.
- Additional fields support for user type selection
- Automatic session management and redirects

✅ **Feature Parity**

- All features from original plan
- Enhanced with talent-specific features
- Enhanced with recruiter-specific features

✅ **Scalable Foundation**

- Easy to add talent marketplace later
- Easy to add ATS integrations
- Easy to add advanced matching

**Next Steps**: Start with Phase 1 (Core Infrastructure) and work through each phase sequentially. Each phase builds on the previous one and has clear acceptance criteria.

**Key Implementation Reminder**: When implementing auth (Phase 2), follow the better-auth-ui-svelte approach with a single catch-all route and Better Auth hooks. No custom form actions or +page.server.ts files are needed for authentication!

Ready to start implementation? 🚀
