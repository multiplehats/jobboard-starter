import { z } from 'zod';

export const PRESET_TYPES = [
	'remote-first', // Remote jobs with optional onsite/hybrid
	'local-only', // Onsite-only jobs (no remote option)
	'hybrid-first', // All types, hybrid default
	'flexible', // All types, no defaults
	'custom' // Full control
] as const;

export const FIELD_MODES = ['hidden', 'optional', 'required', 'conditional'] as const;

/**
 * Field mode:
 * - hidden: Field not shown, not validated, not in schema
 * - optional: Field shown but not required
 * - required: Field shown and always required
 * - conditional: Field shown, required based on locationType
 *                (for location: required when onsite/hybrid)
 */
export const fieldConfigSchema = z.object({
	mode: z.enum(FIELD_MODES)
});

export const jobBoardConfigSchema = z
	.object({
		preset: z.enum(PRESET_TYPES),

		// Which location types to allow
		allowedLocationTypes: z.array(z.enum(['remote', 'hybrid', 'onsite'])).min(1),

		// Default location type for new jobs
		defaultLocationType: z.enum(['remote', 'hybrid', 'onsite']).optional(),

		// Field configuration using mode
		fields: z.object({
			location: fieldConfigSchema,
			hiringLocation: fieldConfigSchema,
			workingPermits: fieldConfigSchema,
			salary: fieldConfigSchema
		})
	})
	.refine(
		(config) => {
			// defaultLocationType must be in allowedLocationTypes
			if (
				config.defaultLocationType &&
				!config.allowedLocationTypes.includes(config.defaultLocationType)
			) {
				return false;
			}
			return true;
		},
		{
			message: 'defaultLocationType must be one of the allowedLocationTypes'
		}
	);

export type JobBoardConfig = z.infer<typeof jobBoardConfigSchema>;
export type PresetType = (typeof PRESET_TYPES)[number];
export type FieldMode = (typeof FIELD_MODES)[number];
