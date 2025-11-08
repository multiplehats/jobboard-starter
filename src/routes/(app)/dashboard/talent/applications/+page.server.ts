import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { jobApplicationRepository } from '$lib/features/talent/server/applications-repository';

export const load: PageServerLoad = async ({ parent, url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	const user = locals.user;

	// Get status filter from query params
	const statusFilter = url.searchParams.get('status');

	// Load all applications
	let applications = await jobApplicationRepository.findByUser(user.id);

	// Filter by status if provided
	if (statusFilter && statusFilter !== 'all') {
		applications = applications.filter((app) => app.status === statusFilter);
	}

	// Group applications by status for display
	const groupedApplications = {
		modal_shown: applications.filter((app) => app.status === 'modal_shown'),
		cta_clicked: applications.filter((app) => app.status === 'cta_clicked'),
		external_opened: applications.filter((app) => app.status === 'external_opened')
	};

	return {
		applications,
		groupedApplications,
		statusFilter: statusFilter || 'all'
	};
};
