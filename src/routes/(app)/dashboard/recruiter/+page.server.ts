import type { PageServerLoad } from './$types';
import { jobRepository } from '$lib/features/jobs/server/repository';

export const load: PageServerLoad = async ({ parent }) => {
	const { organizations } = await parent();

	// Get organization IDs
	const orgIds = organizations.map((org) => org.id);

	// Load stats and recent jobs in parallel
	const [stats, recentJobs] = await Promise.all([
		jobRepository.getStatsForOrganizations(orgIds),
		jobRepository.findByOrganizations(orgIds).then((jobs) => jobs.slice(0, 5))
	]);

	return {
		stats,
		recentJobs
	};
};
