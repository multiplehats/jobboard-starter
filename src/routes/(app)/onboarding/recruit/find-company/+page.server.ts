import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createOrganization, addUserToOrganization } from '$lib/features/organizations/server/repository';
import { recruiterProfileRepository } from '$lib/features/recruiters/server/repository';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/login');
	}

	// Check if already completed onboarding
	const profile = await recruiterProfileRepository.findByUserId(user.id);
	if (profile?.onboardingCompleted) {
		redirect(302, '/dashboard/recruiter');
	}

	return {
		user
	};
};

export const actions: Actions = {
	createCompany: async (event) => {
		const user = event.locals.user;

		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await event.request.formData();
		const companyName = formData.get('companyName') as string;
		const companyWebsite = formData.get('companyWebsite') as string;

		if (!companyName?.trim()) {
			return fail(400, { error: 'Company name is required' });
		}

		try {
			const organization = await createOrganization({
				name: companyName.trim(),
				website: companyWebsite?.trim() || undefined
			});

			// Add user as admin of the organization
			await addUserToOrganization(user.id, organization.id, 'admin');

			return {
				success: true,
				organizationId: organization.id
			};
		} catch (error) {
			console.error('Error creating organization:', error);
			return fail(500, { error: 'Failed to create company' });
		}
	}
};
