import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { talentProfileRepository } from '$lib/features/talent/server/repository';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent();

	// Redirect to signup if no user
	if (!user) {
		throw redirect(302, '/signup');
	}

	// Load talent profile
	const talentProfile = await talentProfileRepository.findByUserId(user.id);

	// Redirect to signup if no talent profile
	if (!talentProfile) {
		throw redirect(302, '/signup');
	}

	// Redirect to onboarding if not completed
	if (!talentProfile.onboardingCompleted) {
		throw redirect(302, '/onboarding/talent');
	}

	return {
		talentProfile
	};
};
