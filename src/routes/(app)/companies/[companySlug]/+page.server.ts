import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organization } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { jobRepository } from '$lib/features/jobs/server/repository';

export const load: PageServerLoad = async ({ params }) => {
	// Find organization by slug
	const [org] = await db
		.select()
		.from(organization)
		.where(eq(organization.slug, params.companySlug))
		.limit(1);

	if (!org) {
		error(404, 'Company not found');
	}

	// Get all published jobs for this organization
	const jobs = await jobRepository.findPublished({
		organizationId: org.id,
		limit: 100
	});

	// Parse metadata if it exists
	let metadata: Record<string, unknown> = {};
	if (org.metadata) {
		try {
			metadata = typeof org.metadata === 'string' ? JSON.parse(org.metadata) : org.metadata;
		} catch (e) {
			console.error('Failed to parse organization metadata:', e);
		}
	}

	return {
		organization: {
			...org,
			metadata
		},
		jobs,
		seo: {
			title: `${org.name} - Jobs & Company Profile`,
			description:
				(metadata.description as string) ||
				`Explore job opportunities at ${org.name}. ${jobs.length} open positions available.`
		}
	};
};
