import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recruiterProfileRepository } from '$lib/features/recruiters/server/repository';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const orgId = cookies.get('onboarding_org_id');

		await recruiterProfileRepository.update(user.id, {
			onboardingCompleted: true,
			onboardingStep: 3,
			defaultOrganizationId: orgId || undefined
		});

		// Clear onboarding cookies
		cookies.delete('onboarding_org_id', { path: '/onboarding' });
		cookies.delete('verification_email', { path: '/onboarding' });

		return json({ success: true });
	} catch (error) {
		console.error('Error completing recruiter onboarding:', error);
		return json({ error: 'Failed to complete onboarding' }, { status: 500 });
	}
};
