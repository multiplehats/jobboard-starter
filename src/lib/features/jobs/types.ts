import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { jobs } from '$lib/server/db/schema/jobs';
import { jobPayments } from '$lib/server/db/schema/job-payments';

/**
 * Base Types (Single Source of Truth)
 * Inferred directly from database schema
 */
export type Job = InferSelectModel<typeof jobs>;
export type NewJob = InferInsertModel<typeof jobs>;
export type JobPayment = InferSelectModel<typeof jobPayments>;
export type NewJobPayment = InferInsertModel<typeof jobPayments>;
