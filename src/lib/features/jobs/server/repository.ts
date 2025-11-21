import { db } from '$lib/server/db/index.js';
import { jobs, organization } from '$lib/server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { generateJobUrl as generateJobUrlShared } from '$lib/features/jobs/utils.js';
import type { LocationType, JobType, JobStatus } from '$lib/features/jobs/constants.js';

/**
 * Job Types
 */
export type Job = InferSelectModel<typeof jobs>;
export type NewJob = InferInsertModel<typeof jobs>;

/**
 * Job with Organization
 */
export type JobWithOrg = Job & {
	organization: InferSelectModel<typeof organization>;
};

/**
 * Job Filters for querying published jobs
 */
export interface JobFilters {
	locationType?: LocationType;
	jobType?: JobType;
	organizationId?: string;
	status?: JobStatus;
	limit?: number;
	offset?: number;
}

/**
 * Jobs Repository
 *
 * Handles all database operations for jobs.
 */
export const jobRepository = {
	/**
	 * Find a job by organization slug and job slug
	 * Used for URL routes like /companies/{orgSlug}/jobs/{jobSlug}
	 *
	 * @param orgSlug - The organization slug
	 * @param jobSlug - The job slug
	 * @returns The job with organization data or null if not found
	 */
	async findByOrgAndJobSlug(orgSlug: string, jobSlug: string): Promise<JobWithOrg | null> {
		const [result] = await db
			.select({
				// Job fields
				id: jobs.id,
				title: jobs.title,
				slug: jobs.slug,
				description: jobs.description,
				requirements: jobs.requirements,
				benefits: jobs.benefits,
				locationType: jobs.locationType,
				location: jobs.location,
				jobType: jobs.jobType,
				salaryMin: jobs.salaryMin,
				salaryMax: jobs.salaryMax,
				salaryCurrency: jobs.salaryCurrency,
				salaryPeriod: jobs.salaryPeriod,
				applicationUrl: jobs.applicationUrl,
				applicationEmail: jobs.applicationEmail,
				organizationId: jobs.organizationId,
				postedById: jobs.postedById,
				status: jobs.status,
				paymentId: jobs.paymentId,
				paidAt: jobs.paidAt,
				hasNewsletterFeature: jobs.hasNewsletterFeature,
				hasExtendedDuration: jobs.hasExtendedDuration,
				publishedAt: jobs.publishedAt,
				expiresAt: jobs.expiresAt,
				rejectionReason: jobs.rejectionReason,
				viewCount: jobs.viewCount,
				clickCount: jobs.clickCount,
				applicationCount: jobs.applicationCount,
				saveCount: jobs.saveCount,
				lastEditedAt: jobs.lastEditedAt,
				lastEditedById: jobs.lastEditedById,
				editCount: jobs.editCount,
				deletedAt: jobs.deletedAt,
				createdAt: jobs.createdAt,
				updatedAt: jobs.updatedAt,
				// Organization fields
				organization: {
					id: organization.id,
					name: organization.name,
					slug: organization.slug,
					logo: organization.logo,
					createdAt: organization.createdAt,
					metadata: organization.metadata
				}
			})
			.from(jobs)
			.innerJoin(organization, eq(jobs.organizationId, organization.id))
			.where(and(eq(organization.slug, orgSlug), eq(jobs.slug, jobSlug)))
			.limit(1);

		return result ?? null;
	},

	/**
	 * Find published jobs with optional filters
	 *
	 * @param filters - Optional filters for location type, job type, etc.
	 * @returns Array of published jobs with organization data
	 */
	async findPublished(filters?: JobFilters): Promise<JobWithOrg[]> {
		const conditions = [eq(jobs.status, 'published'), sql`${jobs.deletedAt} IS NULL`];

		if (filters?.locationType) {
			conditions.push(eq(jobs.locationType, filters.locationType));
		}

		if (filters?.jobType) {
			conditions.push(eq(jobs.jobType, filters.jobType));
		}

		if (filters?.organizationId) {
			conditions.push(eq(jobs.organizationId, filters.organizationId));
		}

		const results = await db
			.select({
				// Job fields
				id: jobs.id,
				title: jobs.title,
				slug: jobs.slug,
				description: jobs.description,
				requirements: jobs.requirements,
				benefits: jobs.benefits,
				locationType: jobs.locationType,
				location: jobs.location,
				jobType: jobs.jobType,
				salaryMin: jobs.salaryMin,
				salaryMax: jobs.salaryMax,
				salaryCurrency: jobs.salaryCurrency,
				salaryPeriod: jobs.salaryPeriod,
				applicationUrl: jobs.applicationUrl,
				applicationEmail: jobs.applicationEmail,
				organizationId: jobs.organizationId,
				postedById: jobs.postedById,
				status: jobs.status,
				paymentId: jobs.paymentId,
				paidAt: jobs.paidAt,
				hasNewsletterFeature: jobs.hasNewsletterFeature,
				hasExtendedDuration: jobs.hasExtendedDuration,
				publishedAt: jobs.publishedAt,
				expiresAt: jobs.expiresAt,
				rejectionReason: jobs.rejectionReason,
				viewCount: jobs.viewCount,
				clickCount: jobs.clickCount,
				applicationCount: jobs.applicationCount,
				saveCount: jobs.saveCount,
				lastEditedAt: jobs.lastEditedAt,
				lastEditedById: jobs.lastEditedById,
				editCount: jobs.editCount,
				deletedAt: jobs.deletedAt,
				createdAt: jobs.createdAt,
				updatedAt: jobs.updatedAt,
				// Organization fields
				organization: {
					id: organization.id,
					name: organization.name,
					slug: organization.slug,
					logo: organization.logo,
					createdAt: organization.createdAt,
					metadata: organization.metadata
				}
			})
			.from(jobs)
			.innerJoin(organization, eq(jobs.organizationId, organization.id))
			.where(and(...conditions))
			.orderBy(sql`${jobs.publishedAt} DESC`)
			.limit(filters?.limit ?? 50)
			.offset(filters?.offset ?? 0);

		return results;
	},

	/**
	 * Create a new job
	 *
	 * @param data - The job data to create
	 * @returns The created job
	 */
	async create(data: NewJob): Promise<Job> {
		const [job] = await db.insert(jobs).values(data).returning();

		if (!job) {
			throw new Error('Failed to create job');
		}

		return job;
	},

	/**
	 * Update a job by ID
	 *
	 * @param id - The job ID
	 * @param data - The partial job data to update
	 * @returns The updated job or null if not found
	 */
	async update(id: string, data: Partial<Omit<NewJob, 'id'>>): Promise<Job | null> {
		const [job] = await db
			.update(jobs)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(jobs.id, id))
			.returning();

		return job ?? null;
	},

	/**
	 * Check if a slug is unique within an organization
	 *
	 * @param orgId - The organization ID
	 * @param slug - The slug to check
	 * @param excludeJobId - Optional job ID to exclude from check (for updates)
	 * @returns True if slug is unique, false otherwise
	 */
	async isSlugUniqueInOrg(orgId: string, slug: string, excludeJobId?: string): Promise<boolean> {
		const conditions = [eq(jobs.organizationId, orgId), eq(jobs.slug, slug)];

		if (excludeJobId) {
			conditions.push(sql`${jobs.id} != ${excludeJobId}`);
		}

		const [result] = await db
			.select({ id: jobs.id })
			.from(jobs)
			.where(and(...conditions))
			.limit(1);

		return !result;
	},

	/**
	 * Generate a job URL from job and organization data
	 *
	 * @param job - The job with slug
	 * @param org - The organization with slug
	 * @returns The full job URL path
	 */
	generateJobUrl(job: { slug: string }, org: { slug: string }): string {
		return generateJobUrlShared(job, org);
	},

	/**
	 * Find a job by ID
	 *
	 * @param id - The job ID
	 * @returns The job or null if not found
	 */
	async findById(id: string): Promise<Job | null> {
		const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

		return job ?? null;
	},

	/**
	 * Delete a job (soft delete by setting deletedAt)
	 *
	 * @param id - The job ID
	 * @returns True if deleted, false if not found
	 */
	async delete(id: string): Promise<boolean> {
		const [result] = await db
			.update(jobs)
			.set({
				deletedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(jobs.id, id))
			.returning();

		return !!result;
	},

	/**
	 * Increment view count for a job
	 *
	 * @param id - The job ID
	 */
	async incrementViewCount(id: string): Promise<void> {
		await db
			.update(jobs)
			.set({
				viewCount: sql`${jobs.viewCount} + 1`
			})
			.where(eq(jobs.id, id));
	},

	/**
	 * Increment click count for a job
	 *
	 * @param id - The job ID
	 */
	async incrementClickCount(id: string): Promise<void> {
		await db
			.update(jobs)
			.set({
				clickCount: sql`${jobs.clickCount} + 1`
			})
			.where(eq(jobs.id, id));
	},

	/**
	 * Increment application count for a job
	 *
	 * @param id - The job ID
	 */
	async incrementApplicationCount(id: string): Promise<void> {
		await db
			.update(jobs)
			.set({
				applicationCount: sql`${jobs.applicationCount} + 1`
			})
			.where(eq(jobs.id, id));
	},

	/**
	 * Increment save count for a job
	 *
	 * @param id - The job ID
	 */
	async incrementSaveCount(id: string): Promise<void> {
		await db
			.update(jobs)
			.set({
				saveCount: sql`${jobs.saveCount} + 1`
			})
			.where(eq(jobs.id, id));
	},

	/**
	 * Decrement save count for a job
	 *
	 * @param id - The job ID
	 */
	async decrementSaveCount(id: string): Promise<void> {
		await db
			.update(jobs)
			.set({
				saveCount: sql`GREATEST(0, ${jobs.saveCount} - 1)`
			})
			.where(eq(jobs.id, id));
	},

	/**
	 * Find jobs by organization IDs with optional status filter
	 *
	 * @param orgIds - Array of organization IDs
	 * @param status - Optional status filter
	 * @returns Array of jobs with organization data
	 */
	async findByOrganizations(orgIds: string[], status?: string): Promise<JobWithOrg[]> {
		const conditions = [
			sql`${jobs.organizationId} = ANY(${orgIds})`,
			sql`${jobs.deletedAt} IS NULL`
		];

		if (status) {
			conditions.push(eq(jobs.status, status));
		}

		const results = await db
			.select({
				// Job fields
				id: jobs.id,
				title: jobs.title,
				slug: jobs.slug,
				description: jobs.description,
				requirements: jobs.requirements,
				benefits: jobs.benefits,
				locationType: jobs.locationType,
				location: jobs.location,
				jobType: jobs.jobType,
				salaryMin: jobs.salaryMin,
				salaryMax: jobs.salaryMax,
				salaryCurrency: jobs.salaryCurrency,
				salaryPeriod: jobs.salaryPeriod,
				applicationUrl: jobs.applicationUrl,
				applicationEmail: jobs.applicationEmail,
				organizationId: jobs.organizationId,
				postedById: jobs.postedById,
				status: jobs.status,
				paymentId: jobs.paymentId,
				paidAt: jobs.paidAt,
				hasNewsletterFeature: jobs.hasNewsletterFeature,
				hasExtendedDuration: jobs.hasExtendedDuration,
				publishedAt: jobs.publishedAt,
				expiresAt: jobs.expiresAt,
				rejectionReason: jobs.rejectionReason,
				viewCount: jobs.viewCount,
				clickCount: jobs.clickCount,
				applicationCount: jobs.applicationCount,
				saveCount: jobs.saveCount,
				lastEditedAt: jobs.lastEditedAt,
				lastEditedById: jobs.lastEditedById,
				editCount: jobs.editCount,
				deletedAt: jobs.deletedAt,
				createdAt: jobs.createdAt,
				updatedAt: jobs.updatedAt,
				// Organization fields
				organization: {
					id: organization.id,
					name: organization.name,
					slug: organization.slug,
					logo: organization.logo,
					createdAt: organization.createdAt,
					metadata: organization.metadata
				}
			})
			.from(jobs)
			.innerJoin(organization, eq(jobs.organizationId, organization.id))
			.where(and(...conditions))
			.orderBy(sql`${jobs.createdAt} DESC`);

		return results;
	},

	/**
	 * Get job statistics for organizations
	 *
	 * @param orgIds - Array of organization IDs
	 * @returns Stats object with counts
	 */
	async getStatsForOrganizations(orgIds: string[]): Promise<{
		total: number;
		published: number;
		draft: number;
		awaitingPayment: number;
		awaitingApproval: number;
		totalApplications: number;
		totalViews: number;
	}> {
		const [stats] = await db
			.select({
				total: sql<number>`COUNT(*)::int`,
				published: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'published' THEN 1 END)::int`,
				draft: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'draft' THEN 1 END)::int`,
				awaitingPayment: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'awaiting_payment' THEN 1 END)::int`,
				awaitingApproval: sql<number>`COUNT(CASE WHEN ${jobs.status} = 'awaiting_approval' THEN 1 END)::int`,
				totalApplications: sql<number>`SUM(${jobs.applicationCount})::int`,
				totalViews: sql<number>`SUM(${jobs.viewCount})::int`
			})
			.from(jobs)
			.where(and(sql`${jobs.organizationId} = ANY(${orgIds})`, sql`${jobs.deletedAt} IS NULL`));

		return {
			total: stats?.total ?? 0,
			published: stats?.published ?? 0,
			draft: stats?.draft ?? 0,
			awaitingPayment: stats?.awaitingPayment ?? 0,
			awaitingApproval: stats?.awaitingApproval ?? 0,
			totalApplications: stats?.totalApplications ?? 0,
			totalViews: stats?.totalViews ?? 0
		};
	},

	/**
	 * Find a job by ID with organization data
	 *
	 * @param id - The job ID
	 * @returns The job with organization or null if not found
	 */
	async findByIdWithOrg(id: string): Promise<JobWithOrg | null> {
		const [result] = await db
			.select({
				// Job fields
				id: jobs.id,
				title: jobs.title,
				slug: jobs.slug,
				description: jobs.description,
				requirements: jobs.requirements,
				benefits: jobs.benefits,
				locationType: jobs.locationType,
				location: jobs.location,
				jobType: jobs.jobType,
				salaryMin: jobs.salaryMin,
				salaryMax: jobs.salaryMax,
				salaryCurrency: jobs.salaryCurrency,
				salaryPeriod: jobs.salaryPeriod,
				applicationUrl: jobs.applicationUrl,
				applicationEmail: jobs.applicationEmail,
				organizationId: jobs.organizationId,
				postedById: jobs.postedById,
				status: jobs.status,
				paymentId: jobs.paymentId,
				paidAt: jobs.paidAt,
				hasNewsletterFeature: jobs.hasNewsletterFeature,
				hasExtendedDuration: jobs.hasExtendedDuration,
				publishedAt: jobs.publishedAt,
				expiresAt: jobs.expiresAt,
				rejectionReason: jobs.rejectionReason,
				viewCount: jobs.viewCount,
				clickCount: jobs.clickCount,
				applicationCount: jobs.applicationCount,
				saveCount: jobs.saveCount,
				lastEditedAt: jobs.lastEditedAt,
				lastEditedById: jobs.lastEditedById,
				editCount: jobs.editCount,
				deletedAt: jobs.deletedAt,
				createdAt: jobs.createdAt,
				updatedAt: jobs.updatedAt,
				// Organization fields
				organization: {
					id: organization.id,
					name: organization.name,
					slug: organization.slug,
					logo: organization.logo,
					createdAt: organization.createdAt,
					metadata: organization.metadata
				}
			})
			.from(jobs)
			.innerJoin(organization, eq(jobs.organizationId, organization.id))
			.where(eq(jobs.id, id))
			.limit(1);

		return result ?? null;
	}
};
