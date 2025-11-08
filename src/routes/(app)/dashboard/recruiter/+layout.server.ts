import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { recruiterProfileRepository } from '$lib/features/recruiters/server/repository';
import { db } from '$lib/server/db';
import { member, organization } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, parent }) => {
	const { user, userProfile } = await parent();

	if (!user) {
		throw redirect(303, '/auth/login');
	}

	// Check if user has recruiter profile
	const profile = await recruiterProfileRepository.findByUserId(user.id);

	if (!profile) {
		throw redirect(303, '/signup');
	}

	// Check if onboarding is complete
	if (!profile.onboardingCompleted) {
		throw redirect(303, '/onboarding/recruit');
	}

	// Load organizations the user is a member of
	const organizations = await db
		.select({
			id: organization.id,
			name: organization.name,
			slug: organization.slug,
			logo: organization.logo,
			createdAt: organization.createdAt,
			metadata: organization.metadata,
			role: member.role
		})
		.from(member)
		.innerJoin(organization, eq(member.organizationId, organization.id))
		.where(eq(member.userId, user.id));

	return {
		profile,
		organizations
	};
};
