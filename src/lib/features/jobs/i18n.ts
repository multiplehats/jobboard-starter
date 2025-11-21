/**
 * i18n helper functions for job-related enums.
 * Maps enum values to Paraglide message keys.
 */

import type {
	JobType,
	SeniorityLevel,
	LocationType,
	JobStatus,
	HiringLocationType,
	WorkingPermitsType
} from './constants';

/**
 * Message key patterns for job enums.
 * These should match the structure in messages/en.json
 */

// Example Paraglide message keys structure:
// jobs.job_types.full_time -> "Full Time"
// jobs.seniority_levels.entry_level -> "Entry-level"

export const getJobTypeKey = (value: JobType) => `jobs.job_types.${value}` as const;
export const getSeniorityLevelKey = (value: SeniorityLevel) =>
	`jobs.seniority_levels.${value.replace(/-/g, '_')}` as const;
export const getLocationTypeKey = (value: LocationType) => `jobs.location_types.${value}` as const;
export const getJobStatusKey = (value: JobStatus) =>
	`jobs.job_statuses.${value.replace(/-/g, '_')}` as const;
export const getHiringLocationTypeKey = (value: HiringLocationType) =>
	`jobs.hiring_location_types.${value}` as const;
export const getWorkingPermitsTypeKey = (value: WorkingPermitsType) =>
	`jobs.working_permits_types.${value.replace(/-/g, '_')}` as const;

/**
 * Helper to create a label getter for Paraglide messages.
 * This is a simplified version that assumes a flat message structure.
 *
 * @example
 * ```ts
 * import * as m from '$paraglide/messages';
 * const getLabel = createLabelGetter(m.jobs.jobTypes);
 * const label = getLabel('full_time'); // => "Full Time"
 * ```
 */
export function createLabelGetter<T extends Record<string, string>>(messages: T) {
	return (key: keyof T): string => messages[key];
}
