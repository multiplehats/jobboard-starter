import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { talentProfiles, recruiterProfiles, member, organization } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getUserState } from '$lib/features/users/utils';
import type { UserProfile } from '$lib/features/users/types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Get session from Better Auth
	const session = await locals.getSession({
		headers: new Headers()
	});

	const user = session?.user;

	if (!user) {
		return {
			user: null,
			userProfile: null
		};
	}

	// Load talent profile, recruiter profile, and organizations in parallel
	const [talentProfile, recruiterProfile, userOrganizations] = await Promise.all([
		db.query.talentProfiles.findFirst({
			where: eq(talentProfiles.userId, user.id)
		}),
		db.query.recruiterProfiles.findFirst({
			where: eq(recruiterProfiles.userId, user.id)
		}),
		db
			.select({
				id: organization.id,
				name: organization.name,
				slug: organization.slug,
				logo: organization.logo,
				createdAt: organization.createdAt,
				metadata: organization.metadata
			})
			.from(member)
			.innerJoin(organization, eq(member.organizationId, organization.id))
			.where(eq(member.userId, user.id))
	]);

	// Determine user state
	const state = getUserState(talentProfile ?? null, recruiterProfile ?? null);

	const userProfile: UserProfile = {
		state,
		talentProfile: talentProfile ?? null,
		recruiterProfile: recruiterProfile ?? null,
		organizations: userOrganizations
	};

	return {
		user,
		userProfile
	};
};
