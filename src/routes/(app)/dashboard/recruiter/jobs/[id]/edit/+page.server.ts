import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { jobRepository } from '$lib/features/jobs/server/repository';
import { createJobSchema } from '$lib/features/jobs/validators';
import { getUserOrganizations } from '$lib/features/organizations/server/repository';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { organizations } = await parent();

	// Load job
	const job = await jobRepository.findByIdWithOrg(params.id);

	if (!job) {
		throw error(404, 'Job not found');
	}

	// Check if user has permission (is member of job's organization)
	const isMember = organizations.some((org: { id: string }) => org.id === job.organizationId);

	if (!isMember) {
		throw error(403, 'You do not have permission to edit this job');
	}

	return {
		job,
		organizations
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const user = locals.user;

		if (!user) {
			throw error(401, 'Unauthorized');
		}

		// Fetch user's organizations
		const organizations = await getUserOrganizations(user.id);

		const formData = await request.formData();

		// Parse form data
		const data = {
			title: formData.get('title') as string,
			organizationId: formData.get('organizationId') as string,
			locationType: formData.get('locationType') as string,
			location: formData.get('location') as string,
			jobType: formData.get('jobType') as string,
			description: formData.get('description') as string,
			salaryMin: formData.get('salaryMin') ? parseInt(formData.get('salaryMin') as string) : undefined,
			salaryMax: formData.get('salaryMax') ? parseInt(formData.get('salaryMax') as string) : undefined,
			salaryCurrency: formData.get('salaryCurrency') as string,
			salaryPeriod: formData.get('salaryPeriod') as string,
			applicationUrl: formData.get('applicationUrl') as string,
			applicationEmail: formData.get('applicationEmail') as string,
			status: formData.get('status') as 'draft' | 'published'
		};

		// Validate
		const validation = createJobSchema.safeParse(data);

		if (!validation.success) {
			return fail(400, {
				message: 'Validation failed',
				errors: validation.error.flatten().fieldErrors,
				data
			});
		}

		// Get current job
		const job = await jobRepository.findByIdWithOrg(params.id);

		if (!job) {
			return fail(404, { message: 'Job not found' });
		}

		// Check if user has permission
		const isMember = organizations.some((org: { id: string }) => org.id === job.organizationId);

		if (!isMember) {
			return fail(403, { message: 'You do not have permission to edit this job' });
		}

		// Check if organization changed
		if (data.organizationId !== job.organizationId) {
			const isNewOrgMember = organizations.some((org: { id: string }) => org.id === data.organizationId);
			if (!isNewOrgMember) {
				return fail(403, { message: 'You are not a member of the new organization' });
			}
		}

		// Generate new slug if title changed and organization changed
		let slug = job.slug;
		if (data.title !== job.title || data.organizationId !== job.organizationId) {
			const baseSlug = data.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');

			slug = baseSlug;
			let counter = 1;
			while (!(await jobRepository.isSlugUniqueInOrg(data.organizationId, slug, params.id))) {
				slug = `${baseSlug}-${counter}`;
				counter++;
			}
		}

		// Update job
		await jobRepository.update(params.id, {
			title: data.title,
			slug,
			organizationId: data.organizationId,
			locationType: data.locationType as any,
			location: data.location || null,
			jobType: data.jobType as any,
			description: { content: data.description },
			salaryMin: data.salaryMin ?? null,
			salaryMax: data.salaryMax ?? null,
			salaryCurrency: data.salaryCurrency || 'USD',
			salaryPeriod: data.salaryPeriod as any || 'year',
			applicationUrl: data.applicationUrl,
			applicationEmail: data.applicationEmail || null,
			status: data.status,
			publishedAt: data.status === 'published' && !job.publishedAt ? new Date() : job.publishedAt,
			lastEditedAt: new Date(),
			lastEditedById: user.id,
			editCount: job.editCount + 1
		});

		throw redirect(303, '/dashboard/recruiter/jobs');
	}
};
