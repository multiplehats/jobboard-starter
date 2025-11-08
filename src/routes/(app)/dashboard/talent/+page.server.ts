import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { savedJobRepository } from '$lib/features/talent/server/saved-jobs-repository';
import { jobApplicationRepository } from '$lib/features/talent/server/applications-repository';

export const load: PageServerLoad = async ({ parent, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	const user = locals.user;

	const { talentProfile } = await parent();

	// Load stats and recent items in parallel
	const [savedJobsCount, applicationsCount, recentApplications, recentSavedJobs] =
		await Promise.all([
			savedJobRepository.countByUser(user.id),
			// Count all applications
			jobApplicationRepository.findByUser(user.id).then((apps) => apps.length),
			// Get last 5 applications
			jobApplicationRepository.findByUser(user.id).then((apps) => apps.slice(0, 5)),
			// Get last 5 saved jobs
			savedJobRepository.findByUser(user.id).then((jobs) => jobs.slice(0, 5))
		]);

	return {
		stats: {
			savedJobs: savedJobsCount,
			applications: applicationsCount
		},
		recentApplications,
		recentSavedJobs
	};
};
