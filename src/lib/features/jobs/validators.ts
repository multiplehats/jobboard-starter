import { z } from 'zod';
import {
	LOCATION_TYPES,
	JOB_TYPES,
	JOB_STATUSES,
	SENIORITY_LEVELS,
	HIRING_LOCATION_TYPES,
	WORKING_PERMITS_TYPES,
	CURRENCIES
} from './constants';

/**
 * Authenticated Job Creation (for recruiters)
 */
export const createJobSchema = z.object({
	// Step 1: Basic Info
	title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
	organizationId: z.string().min(1, 'Organization is required'),
	locationType: z.enum(LOCATION_TYPES, {
		required_error: 'Location type is required'
	}),
	location: z.string().optional(),
	jobType: z.enum(JOB_TYPES, {
		required_error: 'Job type is required'
	}),

	// Step 2: Details
	description: z.string().min(1, 'Description is required'),
	salaryMin: z.number().int().positive().optional(),
	salaryMax: z.number().int().positive().optional(),
	salaryCurrency: z.enum(CURRENCIES).default('USD'),

	// Step 3: Application
	applicationUrl: z.string().url('Must be a valid URL').min(1, 'Application URL is required'),
	applicationEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),

	// Status
	status: z.enum(JOB_STATUSES).default('draft')
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
		type: z.enum(JOB_TYPES, {
			required_error: 'Job type is required'
		}),
		seniority: z
			.array(z.enum(SENIORITY_LEVELS))
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
	locationType: z.enum(LOCATION_TYPES).default('remote'),

	// Hiring location constraints
	hiringLocation: z.object({
		type: z.enum(HIRING_LOCATION_TYPES),
		timezones: z.array(z.string()).default([])
	}),

	// Working permits requirements
	workingPermits: z.object({
		type: z.enum(WORKING_PERMITS_TYPES),
		permits: z.array(z.string()).default([])
	}),

	// Salary information (annual)
	salary: z
		.object({
			min: z.number().int().positive().optional(),
			max: z.number().int().positive().optional(),
			currency: z.enum(CURRENCIES).default('USD')
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

	// Selected upsells (flexible - array of upsell IDs from pricing config)
	selectedUpsells: z.array(z.string()).default([])
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type PublicJobPostingInput = z.infer<typeof publicJobPostingSchema>;
