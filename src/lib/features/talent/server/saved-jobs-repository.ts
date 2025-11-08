import { db } from '$lib/server/db/index.js';
import { savedJobs, jobs, organization } from '$lib/server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Saved Job Types
 */
export type SavedJob = InferSelectModel<typeof savedJobs>;
export type NewSavedJob = InferInsertModel<typeof savedJobs>;

/**
 * Saved Job with Job and Organization details
 */
export type SavedJobWithDetails = SavedJob & {
	job: InferSelectModel<typeof jobs> & {
		organization: InferSelectModel<typeof organization>;
	};
};

/**
 * Saved Jobs Repository
 *
 * Handles all database operations for saved jobs (talent bookmarks).
 */
export const savedJobRepository = {
	/**
	 * Save a job for a user
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @param notes - Optional private notes
	 * @returns The created saved job record
	 */
	async save(userId: string, jobId: string, notes?: string): Promise<SavedJob> {
		const [savedJob] = await db
			.insert(savedJobs)
			.values({
				userId,
				jobId,
				notes: notes ?? null
			})
			.returning();

		if (!savedJob) {
			throw new Error('Failed to save job');
		}

		return savedJob;
	},

	/**
	 * Unsave a job for a user
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @returns True if unsaved, false if not found
	 */
	async unsave(userId: string, jobId: string): Promise<boolean> {
		const result = await db
			.delete(savedJobs)
			.where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
			.returning();

		return result.length > 0;
	},

	/**
	 * Get all saved jobs for a user with full job and organization details
	 *
	 * @param userId - The user ID
	 * @returns Array of saved jobs with details
	 */
	async findByUser(userId: string): Promise<SavedJobWithDetails[]> {
		const results = await db
			.select()
			.from(savedJobs)
			.innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
			.innerJoin(organization, eq(jobs.organizationId, organization.id))
			.where(and(eq(savedJobs.userId, userId), sql`${jobs.deletedAt} IS NULL`))
			.orderBy(sql`${savedJobs.createdAt} DESC`);

		return results.map((row) => ({
			...row.saved_jobs,
			job: {
				...row.jobs,
				organization: row.organization
			}
		}));
	},

	/**
	 * Check if a job is saved by a user
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @returns True if saved, false otherwise
	 */
	async isSaved(userId: string, jobId: string): Promise<boolean> {
		const [result] = await db
			.select({ id: savedJobs.id })
			.from(savedJobs)
			.where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
			.limit(1);

		return !!result;
	},

	/**
	 * Update notes for a saved job
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @param notes - The notes to update
	 * @returns The updated saved job or null if not found
	 */
	async updateNotes(userId: string, jobId: string, notes: string): Promise<SavedJob | null> {
		const [savedJob] = await db
			.update(savedJobs)
			.set({ notes })
			.where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
			.returning();

		return savedJob ?? null;
	},

	/**
	 * Get count of saved jobs for a user
	 *
	 * @param userId - The user ID
	 * @returns The count of saved jobs
	 */
	async countByUser(userId: string): Promise<number> {
		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(savedJobs)
			.where(eq(savedJobs.userId, userId));

		return result?.count ?? 0;
	}
};
