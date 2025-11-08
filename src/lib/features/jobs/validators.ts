import { z } from 'zod';

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

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
