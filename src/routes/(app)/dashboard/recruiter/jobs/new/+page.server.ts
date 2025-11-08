import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { jobRepository } from '$lib/features/jobs/server/repository';
import { createJobSchema } from '$lib/features/jobs/validators';
import { getUserOrganizations } from '$lib/features/organizations/server/repository';

export const load: PageServerLoad = async ({ parent }) => {
	const { organizations } = await parent();

	return {
		organizations
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
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

		// Check if user is member of selected organization
		const isMember = organizations.some((org) => org.id === data.organizationId);

		if (!isMember) {
			return fail(403, { message: 'You are not a member of this organization' });
		}

		// Generate slug from title
		const baseSlug = data.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');

		// Ensure slug is unique within organization
		let slug = baseSlug;
		let counter = 1;
		while (!(await jobRepository.isSlugUniqueInOrg(data.organizationId, slug))) {
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		// Create job
		const job = await jobRepository.create({
			title: data.title,
			slug,
			organizationId: data.organizationId,
			locationType: data.locationType as any,
			location: data.location || null,
			jobType: data.jobType as any,
			description: { content: data.description }, // Wrap in JSON for now (Tiptap later)
			salaryMin: data.salaryMin ?? null,
			salaryMax: data.salaryMax ?? null,
			salaryCurrency: data.salaryCurrency || 'USD',
			salaryPeriod: data.salaryPeriod as any || 'year',
			applicationUrl: data.applicationUrl,
			applicationEmail: data.applicationEmail || null,
			postedById: user.id,
			status: data.status,
			publishedAt: data.status === 'published' ? new Date() : null
		});

		throw redirect(303, '/dashboard/recruiter/jobs');
	}
};
