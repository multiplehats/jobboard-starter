import { db } from '$lib/server/db/index.js';
import { talentProfiles } from '$lib/server/db/schema/talent-profiles.js';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Talent Profile Types
 */
export type TalentProfile = InferSelectModel<typeof talentProfiles>;
export type NewTalentProfile = InferInsertModel<typeof talentProfiles>;

/**
 * Talent Profiles Repository
 *
 * Handles all database operations for talent profiles.
 */
export const talentProfileRepository = {
	/**
	 * Find a talent profile by user ID
	 *
	 * @param userId - The ID of the user
	 * @returns The talent profile or null if not found
	 */
	async findByUserId(userId: string): Promise<TalentProfile | null> {
		const [profile] = await db
			.select()
			.from(talentProfiles)
			.where(eq(talentProfiles.userId, userId))
			.limit(1);

		return profile ?? null;
	},

	/**
	 * Create a new talent profile
	 *
	 * @param data - The talent profile data to create
	 * @returns The created talent profile
	 */
	async create(data: NewTalentProfile): Promise<TalentProfile> {
		const [profile] = await db.insert(talentProfiles).values(data).returning();

		if (!profile) {
			throw new Error('Failed to create talent profile');
		}

		return profile;
	},

	/**
	 * Update a talent profile by user ID
	 *
	 * @param userId - The ID of the user
	 * @param data - The partial talent profile data to update
	 * @returns The updated talent profile or null if not found
	 */
	async update(
		userId: string,
		data: Partial<Omit<NewTalentProfile, 'userId'>>
	): Promise<TalentProfile | null> {
		const [profile] = await db
			.update(talentProfiles)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(talentProfiles.userId, userId))
			.returning();

		return profile ?? null;
	},

	/**
	 * Delete a talent profile by user ID
	 *
	 * @param userId - The ID of the user
	 * @returns True if deleted, false if not found
	 */
	async delete(userId: string): Promise<boolean> {
		const result = await db
			.delete(talentProfiles)
			.where(eq(talentProfiles.userId, userId))
			.returning();

		return result.length > 0;
	},

	/**
	 * Check if a talent profile exists for a user
	 *
	 * @param userId - The ID of the user
	 * @returns True if profile exists, false otherwise
	 */
	async exists(userId: string): Promise<boolean> {
		const [profile] = await db
			.select({ id: talentProfiles.id })
			.from(talentProfiles)
			.where(eq(talentProfiles.userId, userId))
			.limit(1);

		return !!profile;
	}
};
