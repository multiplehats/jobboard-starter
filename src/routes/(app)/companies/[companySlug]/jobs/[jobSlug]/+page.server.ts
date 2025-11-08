import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { jobRepository } from '$lib/features/jobs/server/repository';
import { db } from '$lib/server/db';
import { savedJobs, jobApplications } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Find job by organization slug and job slug
	const job = await jobRepository.findByOrgAndJobSlug(params.companySlug, params.jobSlug);

	if (!job) {
		error(404, 'Job not found');
	}

	// Only show published jobs to public
	if (job.status !== 'published') {
		error(404, 'Job not found');
	}

	// Increment view count (fire and forget)
	jobRepository.incrementViewCount(job.id).catch((err) => {
		console.error('Failed to increment view count:', err);
	});

	// Check if user has saved this job
	let hasSaved = false;
	let hasApplied = false;

	if (locals.user) {
		// Check if job is saved
		const [savedJob] = await db
			.select()
			.from(savedJobs)
			.where(and(eq(savedJobs.userId, locals.user.id), eq(savedJobs.jobId, job.id)))
			.limit(1);

		hasSaved = !!savedJob;

		// Check if user has applied
		const [application] = await db
			.select()
			.from(jobApplications)
			.where(and(eq(jobApplications.userId, locals.user.id), eq(jobApplications.jobId, job.id)))
			.limit(1);

		hasApplied = !!application;
	}

	// Get other jobs from the same organization (for "Similar Jobs" section)
	const similarJobs = await jobRepository.findPublished({
		organizationId: job.organizationId,
		limit: 6
	});

	// Filter out current job from similar jobs
	const filteredSimilarJobs = similarJobs.filter((j) => j.id !== job.id).slice(0, 3);

	// Parse organization metadata
	let orgMetadata: Record<string, unknown> = {};
	if (job.organization.metadata) {
		try {
			orgMetadata =
				typeof job.organization.metadata === 'string'
					? JSON.parse(job.organization.metadata)
					: job.organization.metadata;
		} catch (e) {
			console.error('Failed to parse organization metadata:', e);
		}
	}

	// Extract plain text from description for SEO (limit to 155 chars)
	let descriptionText = '';
	if (job.description && typeof job.description === 'object') {
		const extractText = (node: unknown): string => {
			if (!node || typeof node !== 'object') return '';
			const n = node as { type?: string; text?: string; content?: unknown[] };
			if (n.type === 'text' && n.text) return n.text;
			if (n.content && Array.isArray(n.content)) {
				return n.content.map((child) => extractText(child)).join(' ');
			}
			return '';
		};
		descriptionText = extractText(job.description).slice(0, 155);
	}

	return {
		job: {
			...job,
			organization: {
				...job.organization,
				metadata: orgMetadata
			}
		},
		hasSaved,
		hasApplied,
		similarJobs: filteredSimilarJobs,
		seo: {
			title: `${job.title} at ${job.organization.name}`,
			description: descriptionText || `Apply for ${job.title} at ${job.organization.name}.`
		}
	};
};
