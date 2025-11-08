import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { talentProfileRepository } from '$lib/features/talent/server/repository';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/login');
	}

	// Check if already completed onboarding
	const profile = await talentProfileRepository.findByUserId(user.id);
	if (profile?.onboardingCompleted) {
		redirect(302, '/dashboard/talent');
	}

	return {
		user,
		profile
	};
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const user = event.locals.user;

		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await event.request.formData();

		try {
			const desiredJobTypes = JSON.parse(formData.get('desiredJobTypes') as string);
			const desiredLocationTypes = JSON.parse(formData.get('desiredLocationTypes') as string);
			const yearsOfExperience = parseInt(formData.get('yearsOfExperience') as string);
			const skills = JSON.parse(formData.get('skills') as string);

			await talentProfileRepository.update(user.id, {
				desiredJobTypes,
				desiredLocationTypes,
				yearsOfExperience,
				skills,
				onboardingCompleted: true,
				onboardingStep: 5
			});

			redirect(303, '/dashboard/talent');
		} catch (error) {
			console.error('Error updating talent profile:', error);
			return fail(500, { message: 'Failed to update profile' });
		}
	}
};
