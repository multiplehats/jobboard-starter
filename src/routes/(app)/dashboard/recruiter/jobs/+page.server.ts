import type { PageServerLoad, Actions } from './$types';
import { jobRepository } from '$lib/features/jobs/server/repository';
import { fail, error } from '@sveltejs/kit';
import { getUserOrganizations } from '$lib/features/organizations/server/repository';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { organizations } = await parent();

	// Get status filter from URL
	const statusFilter = url.searchParams.get('status') || undefined;

	// Get organization IDs
	const orgIds = organizations.map((org) => org.id);

	// Load jobs for user's organizations
	const jobs = await jobRepository.findByOrganizations(orgIds, statusFilter);

	return {
		jobs,
		statusFilter
	};
};

export const actions: Actions = {
	/**
	 * Duplicate a job (create a copy with status=draft)
	 */
	duplicate: async ({ request, locals }) => {
		const user = locals.user;

		if (!user) {
			throw error(401, 'Unauthorized');
		}

		// Fetch user's organizations
		const organizations = await getUserOrganizations(user.id);

		const formData = await request.formData();
		const jobId = formData.get('jobId') as string;

		if (!jobId) {
			return fail(400, { message: 'Job ID is required' });
		}

		// Get the original job
		const originalJob = await jobRepository.findByIdWithOrg(jobId);

		if (!originalJob) {
			return fail(404, { message: 'Job not found' });
		}

		// Check if user has permission (is member of job's organization)
		const isMember = organizations.some((org: { id: string }) => org.id === originalJob.organizationId);

		if (!isMember) {
			return fail(403, { message: 'You do not have permission to duplicate this job' });
		}

		// Create a copy with status=draft and modified title
		const newJob = await jobRepository.create({
			title: `${originalJob.title} (Copy)`,
			slug: `${originalJob.slug}-copy-${Date.now()}`,
			description: originalJob.description,
			requirements: originalJob.requirements,
			benefits: originalJob.benefits,
			locationType: originalJob.locationType,
			location: originalJob.location,
			jobType: originalJob.jobType,
			salaryMin: originalJob.salaryMin,
			salaryMax: originalJob.salaryMax,
			salaryCurrency: originalJob.salaryCurrency,
			salaryPeriod: originalJob.salaryPeriod,
			applicationUrl: originalJob.applicationUrl,
			applicationEmail: originalJob.applicationEmail,
			organizationId: originalJob.organizationId,
			postedById: user.id,
			status: 'draft'
		});

		return { success: true, jobId: newJob.id };
	},

	/**
	 * Soft delete a job
	 */
	delete: async ({ request, locals }) => {
		const user = locals.user;

		if (!user) {
			throw error(401, 'Unauthorized');
		}

		// Fetch user's organizations
		const organizations = await getUserOrganizations(user.id);

		const formData = await request.formData();
		const jobId = formData.get('jobId') as string;

		if (!jobId) {
			return fail(400, { message: 'Job ID is required' });
		}

		// Get the job
		const job = await jobRepository.findByIdWithOrg(jobId);

		if (!job) {
			return fail(404, { message: 'Job not found' });
		}

		// Check if user has permission (is member of job's organization)
		const isMember = organizations.some((org: { id: string }) => org.id === job.organizationId);

		if (!isMember) {
			return fail(403, { message: 'You do not have permission to delete this job' });
		}

		// Soft delete
		await jobRepository.delete(jobId);

		return { success: true };
	}
};
