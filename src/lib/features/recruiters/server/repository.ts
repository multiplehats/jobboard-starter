import { db } from '$lib/server/db/index.js';
import { recruiterProfiles } from '$lib/server/db/schema/recruiter-profiles.js';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Recruiter Profile Types
 */
export type RecruiterProfile = InferSelectModel<typeof recruiterProfiles>;
export type NewRecruiterProfile = InferInsertModel<typeof recruiterProfiles>;

/**
 * Recruiter Profiles Repository
 *
 * Handles all database operations for recruiter profiles.
 */
export const recruiterProfileRepository = {
	/**
	 * Find a recruiter profile by user ID
	 *
	 * @param userId - The ID of the user
	 * @returns The recruiter profile or null if not found
	 */
	async findByUserId(userId: string): Promise<RecruiterProfile | null> {
		const [profile] = await db
			.select()
			.from(recruiterProfiles)
			.where(eq(recruiterProfiles.userId, userId))
			.limit(1);

		return profile ?? null;
	},

	/**
	 * Create a new recruiter profile
	 *
	 * @param data - The recruiter profile data to create
	 * @returns The created recruiter profile
	 */
	async create(data: NewRecruiterProfile): Promise<RecruiterProfile> {
		const [profile] = await db.insert(recruiterProfiles).values(data).returning();

		if (!profile) {
			throw new Error('Failed to create recruiter profile');
		}

		return profile;
	},

	/**
	 * Update a recruiter profile by user ID
	 *
	 * @param userId - The ID of the user
	 * @param data - The partial recruiter profile data to update
	 * @returns The updated recruiter profile or null if not found
	 */
	async update(
		userId: string,
		data: Partial<Omit<NewRecruiterProfile, 'userId'>>
	): Promise<RecruiterProfile | null> {
		const [profile] = await db
			.update(recruiterProfiles)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(recruiterProfiles.userId, userId))
			.returning();

		return profile ?? null;
	},

	/**
	 * Delete a recruiter profile by user ID
	 *
	 * @param userId - The ID of the user
	 * @returns True if deleted, false if not found
	 */
	async delete(userId: string): Promise<boolean> {
		const result = await db
			.delete(recruiterProfiles)
			.where(eq(recruiterProfiles.userId, userId))
			.returning();

		return result.length > 0;
	},

	/**
	 * Check if a recruiter profile exists for a user
	 *
	 * @param userId - The ID of the user
	 * @returns True if profile exists, false otherwise
	 */
	async exists(userId: string): Promise<boolean> {
		const [profile] = await db
			.select({ id: recruiterProfiles.id })
			.from(recruiterProfiles)
			.where(eq(recruiterProfiles.userId, userId))
			.limit(1);

		return !!profile;
	}
};
