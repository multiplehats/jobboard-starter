import { z } from 'zod';

/**
 * Step 1: Find Company
 * Used for searching existing companies (no submission, just search)
 */
export const companySearchSchema = z.object({
	query: z.string().min(1, 'Search query is required')
});

/**
 * Step 1: Create New Company (if not found)
 */
export const createCompanySchema = z.object({
	name: z.string().min(1, 'Company name is required').max(255, 'Name is too long'),
	website: z.string().url('Must be a valid URL').min(1, 'Website is required'),
	logo: z.string().url('Must be a valid URL').optional()
});

/**
 * Step 2: Verify Email
 * User enters their work email prefix, system appends domain from selected company
 */
export const verifyEmailSchema = z.object({
	organizationId: z.string().min(1, 'Organization is required'),
	emailPrefix: z
		.string()
		.min(1, 'Email prefix is required')
		.regex(/^[a-zA-Z0-9._-]+$/, 'Invalid email format'),
	domain: z.string().min(1, 'Domain is required'), // e.g., "@productbird.ai"
	// Full email will be constructed as: emailPrefix + domain
	fullEmail: z.string().email('Must be a valid email').optional() // Computed on client
});

/**
 * Step 3: Invite Team
 * Multi-email invite form
 */
export const inviteTeamSchema = z.object({
	organizationId: z.string().min(1, 'Organization is required'),
	emails: z
		.array(z.string().email('Must be a valid email'))
		.min(1, 'At least one email is required')
		.max(10, 'Maximum 10 invites at once')
});

/**
 * Combined onboarding state (for tracking progress)
 */
export const onboardingStateSchema = z.object({
	currentStep: z.number().int().min(1).max(3).default(1),
	selectedOrganizationId: z.string().optional(),
	verifiedEmail: z.string().email().optional(),
	invitedEmails: z.array(z.string().email()).default([])
});

// Type exports
export type CompanySearchInput = z.infer<typeof companySearchSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type InviteTeamInput = z.infer<typeof inviteTeamSchema>;
export type OnboardingState = z.infer<typeof onboardingStateSchema>;
