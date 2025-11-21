import { command, form } from '$app/server';
import { buildPublicJobPostingSchema } from '$lib/features/jobs/validators';
import type { PublicJobPostingInput } from '$lib/features/jobs/validators';
import { getJobBoardConfig } from '$lib/config/jobs/config.server';
import { z } from 'zod';

export type JobPostingFormData = PublicJobPostingInput;

export type SubmitJobOutput = {
	success: boolean;
	jobId: string;
	message: string;
};

/**
 * Get the dynamic schema based on job board config
 * This runs at request time, using the cached config
 */
const getSchema = () => buildPublicJobPostingSchema(getJobBoardConfig());

export const prefillFromATS = command(z.string(), async (atsUrl: string) => {
	// TODO: Implement ATS prefill logic
	console.log('Prefilling from ATS URL:', atsUrl);
});

/**
 * Submit a new public job posting
 */
export const submitJobPosting = form(getSchema(), async (data) => {
	// TODO: Implement job posting logic:
	// 1. Create/find organization
	// 2. Create job with status 'awaiting_payment'
	// 3. Create payment record
	// 4. Initiate payment flow
	// 5. Send confirmation email

	console.log('Job posting data:', data);

	// Simulate processing
	await new Promise((resolve) => setTimeout(resolve, 1000));

	return {
		success: true,
		jobId: 'job_' + Date.now(),
		message: 'Job posted successfully!'
	} satisfies SubmitJobOutput;
});
