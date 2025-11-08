import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { member, jobs } from '$lib/server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
	const { organizations } = await parent();

	// Get member counts and job counts for each organization
	const orgsWithDetails = await Promise.all(
		organizations.map(async (org) => {
			// Get member count
			const [memberCountResult] = await db
				.select({ count: sql<number>`COUNT(*)::int` })
				.from(member)
				.where(eq(member.organizationId, org.id));

			// Get job count
			const [jobCountResult] = await db
				.select({ count: sql<number>`COUNT(*)::int` })
				.from(jobs)
				.where(and(eq(jobs.organizationId, org.id), sql`${jobs.deletedAt} IS NULL`));

			return {
				...org,
				memberCount: memberCountResult?.count ?? 0,
				jobCount: jobCountResult?.count ?? 0
			};
		})
	);

	return {
		organizationsWithDetails: orgsWithDetails
	};
};
