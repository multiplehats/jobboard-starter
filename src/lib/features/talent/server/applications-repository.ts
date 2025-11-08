import { db } from '$lib/server/db/index.js';
import { jobApplications, jobs, organization } from '$lib/server/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Job Application Types
 */
export type JobApplication = InferSelectModel<typeof jobApplications>;
export type NewJobApplication = InferInsertModel<typeof jobApplications>;

/**
 * Job Application with Job and Organization details
 */
export type JobApplicationWithDetails = JobApplication & {
	job: InferSelectModel<typeof jobs> & {
		organization: InferSelectModel<typeof organization>;
	};
};

/**
 * Job Applications Repository
 *
 * Handles all database operations for job application tracking.
 * Tracks the 3-stage application process:
 * 1. modal_shown - Application modal was displayed to user
 * 2. cta_clicked - User clicked the apply button in modal
 * 3. external_opened - External application link was opened
 */
export const jobApplicationRepository = {
	/**
	 * Create a new job application tracking record
	 *
	 * @param data - The application data to create
	 * @returns The created application record
	 */
	async create(data: NewJobApplication): Promise<JobApplication> {
		const [application] = await db.insert(jobApplications).values(data).returning();

		if (!application) {
			throw new Error('Failed to create job application');
		}

		return application;
	},

	/**
	 * Update an existing job application
	 *
	 * @param id - The application ID
	 * @param data - The partial application data to update
	 * @returns The updated application or null if not found
	 */
	async update(
		id: string,
		data: Partial<Omit<NewJobApplication, 'id' | 'userId' | 'jobId'>>
	): Promise<JobApplication | null> {
		const [application] = await db
			.update(jobApplications)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(jobApplications.id, id))
			.returning();

		return application ?? null;
	},

	/**
	 * Get all applications for a user with full job and organization details
	 *
	 * @param userId - The user ID
	 * @returns Array of applications with details
	 */
	async findByUser(userId: string): Promise<JobApplicationWithDetails[]> {
		const results = await db
			.select()
			.from(jobApplications)
			.innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
			.innerJoin(organization, eq(jobs.organizationId, organization.id))
			.where(eq(jobApplications.userId, userId))
			.orderBy(desc(jobApplications.createdAt));

		return results.map((row) => ({
			...row.job_applications,
			job: {
				...row.jobs,
				organization: row.organization
			}
		}));
	},

	/**
	 * Get all applications for a specific job
	 *
	 * @param jobId - The job ID
	 * @returns Array of applications for the job
	 */
	async findByJob(jobId: string): Promise<JobApplication[]> {
		const results = await db
			.select()
			.from(jobApplications)
			.where(eq(jobApplications.jobId, jobId))
			.orderBy(desc(jobApplications.createdAt));

		return results;
	},

	/**
	 * Find an application by user and job
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @returns The application or null if not found
	 */
	async findByUserAndJob(userId: string, jobId: string): Promise<JobApplication | null> {
		const [application] = await db
			.select()
			.from(jobApplications)
			.where(and(eq(jobApplications.userId, userId), eq(jobApplications.jobId, jobId)))
			.limit(1);

		return application ?? null;
	},

	/**
	 * Check if a user has applied to a job
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @returns True if user has applied, false otherwise
	 */
	async hasApplied(userId: string, jobId: string): Promise<boolean> {
		const application = await this.findByUserAndJob(userId, jobId);
		return !!application;
	},

	/**
	 * Track modal shown event
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @returns The created or updated application record
	 */
	async trackModalShown(userId: string, jobId: string): Promise<JobApplication> {
		// Check if application already exists
		const existing = await this.findByUserAndJob(userId, jobId);

		if (existing) {
			// Update existing with modal shown timestamp if not already set
			if (!existing.modalShownAt) {
				const updated = await this.update(existing.id, {
					modalShownAt: new Date()
				});
				return updated!;
			}
			return existing;
		}

		// Create new application tracking record
		return this.create({
			userId,
			jobId,
			status: 'modal_shown',
			modalShownAt: new Date()
		});
	},

	/**
	 * Track CTA clicked event
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @returns The updated application record
	 */
	async trackCtaClicked(userId: string, jobId: string): Promise<JobApplication> {
		const existing = await this.findByUserAndJob(userId, jobId);

		if (!existing) {
			// Create new if doesn't exist
			return this.create({
				userId,
				jobId,
				status: 'cta_clicked',
				modalShownAt: new Date(),
				ctaClickedAt: new Date()
			});
		}

		// Update status and timestamp
		const updated = await this.update(existing.id, {
			status: 'cta_clicked',
			ctaClickedAt: new Date()
		});

		return updated!;
	},

	/**
	 * Track external link opened event
	 *
	 * @param userId - The user ID
	 * @param jobId - The job ID
	 * @returns The updated application record
	 */
	async trackExternalOpened(userId: string, jobId: string): Promise<JobApplication> {
		const existing = await this.findByUserAndJob(userId, jobId);

		if (!existing) {
			// Create new if doesn't exist
			return this.create({
				userId,
				jobId,
				status: 'external_opened',
				modalShownAt: new Date(),
				ctaClickedAt: new Date(),
				externalOpenedAt: new Date()
			});
		}

		// Update status and timestamp
		const updated = await this.update(existing.id, {
			status: 'external_opened',
			externalOpenedAt: new Date()
		});

		return updated!;
	}
};
