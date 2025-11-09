import { z } from 'zod';

/**
 * Authenticated Job Creation (for recruiters)
 */
export const createJobSchema = z.object({
	// Step 1: Basic Info
	title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
	organizationId: z.string().min(1, 'Organization is required'),
	locationType: z.enum(['remote', 'hybrid', 'onsite'], {
		required_error: 'Location type is required'
	}),
	location: z.string().optional(),
	jobType: z.enum(['full_time', 'part_time', 'contract', 'freelance'], {
		required_error: 'Job type is required'
	}),

	// Step 2: Details
	description: z.string().min(1, 'Description is required'),
	salaryMin: z.number().int().positive().optional(),
	salaryMax: z.number().int().positive().optional(),
	salaryCurrency: z.string().default('USD'),
	salaryPeriod: z.enum(['year', 'month', 'hour']).default('year'),

	// Step 3: Application
	applicationUrl: z.string().url('Must be a valid URL').min(1, 'Application URL is required'),
	applicationEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),

	// Status
	status: z.enum(['draft', 'awaiting_payment', 'awaiting_approval', 'published']).default('draft')
});

export const updateJobSchema = createJobSchema.partial().extend({
	id: z.string().min(1, 'Job ID is required')
});

/**
 * Public Job Posting (for /post-a-job page)
 * Matches the form structure in src/routes/(public)/post-a-job/+page.svelte
 */
export const publicJobPostingSchema = z.object({
	// Job fields
	job: z.object({
		title: z.string().min(1, 'Title is required').max(80, 'Title must be under 80 characters'),
		description: z.string().min(1, 'Description is required'),
		type: z.enum(
			['Full Time', 'Part Time', 'Contractor', 'Temporary', 'Intern', 'Volunteer', 'Other'],
			{
				required_error: 'Job type is required'
			}
		),
		seniority: z
			.array(z.enum(['Entry-level', 'Mid-level', 'Senior', 'Manager', 'Director', 'Executive']))
			.min(1, 'At least one seniority level is required'),
		appLinkOrEmail: z
			.string()
			.min(1, 'Application method is required')
			.refine(
				(val) => {
					// Check if it's a valid email or URL
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					const urlRegex = /^https?:\/\/.+/;
					return emailRegex.test(val) || urlRegex.test(val);
				},
				{ message: 'Must be a valid email or URL' }
			),
		applicationDeadline: z
			.string()
			.refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date' })
	}),

	// Location type (always remote for this page)
	locationType: z.enum(['remote', 'hybrid', 'onsite']).default('remote'),

	// Hiring location constraints
	hiringLocation: z.object({
		type: z.enum(['worldwide', 'timezone']),
		timezones: z.array(z.string()).default([])
	}),

	// Working permits requirements
	workingPermits: z.object({
		type: z.enum(['no-specific', 'required']),
		permits: z.array(z.string()).default([])
	}),

	// Salary information
	salary: z
		.object({
			min: z.number().int().positive().optional(),
			max: z.number().int().positive().optional(),
			currency: z.string().default('USD'),
			period: z.enum(['year', 'month', 'hour']).default('year')
		})
		.refine(
			(data) => {
				// If both min and max are provided, max should be >= min
				if (data.min !== undefined && data.max !== undefined) {
					return data.max >= data.min;
				}
				return true;
			},
			{ message: 'Maximum salary must be greater than or equal to minimum salary' }
		),

	// Organization info for new/unregistered companies
	organization: z.object({
		name: z.string().min(1, 'Company name is required'),
		url: z.string().url('Must be a valid URL'),
		logo: z.string().optional()
	}),

	// Customer contact
	customerEmail: z.string().email('Must be a valid email'),

	// Optional upgrades
	upgrades: z.object({
		featureInEmails: z.boolean().default(false)
	})
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type PublicJobPostingInput = z.infer<typeof publicJobPostingSchema>;
