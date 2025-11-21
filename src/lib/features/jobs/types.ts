import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { jobs } from '$lib/server/db/schema/jobs';

/**
 * Base Types (Single Source of Truth)
 * Inferred directly from database schema
 */
export type Job = InferSelectModel<typeof jobs>;
export type NewJob = InferInsertModel<typeof jobs>;
