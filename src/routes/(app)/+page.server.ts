import type { PageServerLoad } from './$types';
import { jobRepository } from '$lib/features/jobs/server/repository';

export const load: PageServerLoad = async ({ url }) => {
	// Get filter params from URL
	const locationType = url.searchParams.get('location_type') || undefined;
	const jobType = url.searchParams.get('job_type') || undefined;

	// Fetch published jobs with filters
	const jobs = await jobRepository.findPublished({
		locationType,
		jobType,
		limit: 50
	});

	return {
		jobs,
		filters: {
			locationType,
			jobType
		}
	};
};
