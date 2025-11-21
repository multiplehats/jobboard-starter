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
	city: z.string().max(255, 'City must be under 255 characters').optional(),
	country: z.string().length(2, 'Country must be a 2-letter ISO code').optional(),
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
 * Base job posting schema with all fields optional
 * This maintains type safety while allowing runtime validation
 */
export const baseJobPostingSchema = z.object({
	job: z.object({
		title: z.string().min(1, 'Title is required').max(80, 'Title must be under 80 characters'),
		description: z.string().min(1, 'Description is required'),
		type: z.enum(JOB_TYPES, { required_error: 'Job type is required' }),
		seniority: z
			.array(z.enum(SENIORITY_LEVELS))
			.min(1, 'At least one seniority level is required'),
		appLinkOrEmail: z
			.string()
			.min(1, 'Application method is required')
			.refine(
				(val) => {
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
	locationType: z.enum(LOCATION_TYPES),
	city: z.string().max(255, 'City must be under 255 characters').optional(),
	country: z.string().length(2, 'Country must be a 2-letter ISO code').optional(),
	hiringLocation: z
		.object({
			type: z.enum(HIRING_LOCATION_TYPES).optional(),
			timezones: z.array(z.string()).default([])
		})
		.optional(),
	workingPermits: z
		.object({
			type: z.enum(WORKING_PERMITS_TYPES).optional(),
			permits: z.array(z.string()).default([])
		})
		.optional(),
	salary: z
		.object({
			min: z.number().int().positive().optional(),
			max: z.number().int().positive().optional(),
			currency: z.enum(CURRENCIES).default('USD')
		})
		.refine(
			(data) => {
				if (data.min !== undefined && data.max !== undefined) {
					return data.max >= data.min;
				}
				return true;
			},
			{ message: 'Maximum salary must be greater than or equal to minimum salary' }
		)
		.optional(),
	organization: z.object({
		name: z.string().min(1, 'Company name is required'),
		url: z.string().url('Must be a valid URL'),
		logo: z.string().optional()
	}),
	customerEmail: z.string().email('Must be a valid email'),
	selectedUpsells: z.array(z.string()).default([])
});

export type JobPostingInput = z.infer<typeof baseJobPostingSchema>;

/**
 * Build dynamic schema that only includes visible fields
 * This ensures hidden fields don't appear in validation errors
 */
export function buildPublicJobPostingSchema(config: import('$lib/config/jobs').JobBoardConfig) {
	// Build schema fields based on config
	const schemaFields: any = {
		job: baseJobPostingSchema.shape.job,
		organization: baseJobPostingSchema.shape.organization,
		customerEmail: baseJobPostingSchema.shape.customerEmail,
		selectedUpsells: baseJobPostingSchema.shape.selectedUpsells
	};

	// Location type - only allow configured types with default
	const allowedTypes = config.allowedLocationTypes as [string, ...string[]];
	const defaultType = config.defaultLocationType || config.allowedLocationTypes[0];
	schemaFields.locationType = z.enum(allowedTypes).default(defaultType);

	// Physical location (city + country) - only include if not hidden
	if (config.fields.location.mode !== 'hidden') {
		const locationMode = config.fields.location.mode;

		if (locationMode === 'required') {
			schemaFields.city = z
				.string()
				.min(1, 'City is required')
				.max(255, 'City must be under 255 characters');
			schemaFields.country = z
				.string()
				.length(2, 'Country must be a 2-letter ISO code')
				.min(1, 'Country is required');
		} else {
			// optional or conditional - will validate conditionally below
			schemaFields.city = z.string().max(255, 'City must be under 255 characters').optional();
			schemaFields.country = z
				.string()
				.length(2, 'Country must be a 2-letter ISO code')
				.optional();
		}
	}

	// Hiring location - only include if not hidden
	if (config.fields.hiringLocation.mode !== 'hidden') {
		const mode = config.fields.hiringLocation.mode;

		schemaFields.hiringLocation = z.object({
			type:
				mode === 'required'
					? z.enum(HIRING_LOCATION_TYPES, { required_error: 'Hiring location type is required' })
					: z.enum(HIRING_LOCATION_TYPES).optional(),
			timezones: z.array(z.string()).default([])
		});
	}

	// Working permits - only include if not hidden
	if (config.fields.workingPermits.mode !== 'hidden') {
		const mode = config.fields.workingPermits.mode;

		schemaFields.workingPermits = z.object({
			type:
				mode === 'required'
					? z.enum(WORKING_PERMITS_TYPES, { required_error: 'Working permits type is required' })
					: z.enum(WORKING_PERMITS_TYPES).optional(),
			permits: z.array(z.string()).default([])
		});
	}

	// Salary - only include if not hidden
	if (config.fields.salary.mode !== 'hidden') {
		const mode = config.fields.salary.mode;

		const salaryBase = z
			.object({
				min: z.number().int().positive().optional(),
				max: z.number().int().positive().optional(),
				currency: z.enum(CURRENCIES).default('USD')
			})
			.refine(
				(data) => {
					if (data.min !== undefined && data.max !== undefined) {
						return data.max >= data.min;
					}
					return true;
				},
				{ message: 'Maximum salary must be greater than or equal to minimum salary' }
			);

		if (mode === 'required') {
			schemaFields.salary = salaryBase.refine(
				(data) => data.min !== undefined || data.max !== undefined,
				{ message: 'Salary information is required' }
			);
		} else {
			schemaFields.salary = salaryBase;
		}
	}

	// Build base schema
	let schema = z.object(schemaFields);

	// Add conditional validations

	// 1. City and country are required for onsite/hybrid when mode is 'conditional'
	if (config.fields.location.mode === 'conditional') {
		schema = schema
			.refine(
				(data) => {
					if (data.locationType === 'onsite' || data.locationType === 'hybrid') {
						return data.city && data.city.length > 0;
					}
					return true;
				},
				{
					message: (data: any) => {
						if (data.locationType === 'onsite') {
							return 'City is required for onsite positions';
						}
						return 'City is required for hybrid positions';
					},
					path: ['city']
				}
			)
			.refine(
				(data) => {
					if (data.locationType === 'onsite' || data.locationType === 'hybrid') {
						return data.country && data.country.length > 0;
					}
					return true;
				},
				{
					message: (data: any) => {
						if (data.locationType === 'onsite') {
							return 'Country is required for onsite positions';
						}
						return 'Country is required for hybrid positions';
					},
					path: ['country']
				}
			);
	}

	// 2. Timezones are required when hiringLocation type is 'timezone'
	if (config.fields.hiringLocation.mode !== 'hidden') {
		schema = schema.refine(
			(data) => {
				if (data.hiringLocation?.type === 'timezone') {
					return data.hiringLocation.timezones && data.hiringLocation.timezones.length > 0;
				}
				return true;
			},
			{
				message: 'At least one timezone is required when hiring by timezone',
				path: ['hiringLocation', 'timezones']
			}
		);
	}

	return schema;
}

/**
 * Validate job posting data against config
 * This is the main validation function used in forms
 */
export function validateJobPosting(
	data: unknown,
	config: import('$lib/config/jobs').JobBoardConfig
) {
	const schema = buildPublicJobPostingSchema(config);
	return schema.parse(data);
}

/**
 * Type for the validated job posting
 * This is what you get after successful validation
 */
export type ValidatedJobPosting = z.infer<typeof baseJobPostingSchema>;

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type PublicJobPostingInput = JobPostingInput;
