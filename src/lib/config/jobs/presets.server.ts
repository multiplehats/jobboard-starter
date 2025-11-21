import type { JobBoardConfig, PresetType } from './schema.server';
import { jobBoardConfigSchema } from './schema.server';

/**
 * Remote-First: Tech/startup job boards
 * - All location types allowed
 * - Remote is default
 * - Location required only for onsite/hybrid
 */
export const REMOTE_FIRST_PRESET: JobBoardConfig = {
	preset: 'remote-first',
	allowedLocationTypes: ['remote', 'hybrid', 'onsite'],
	defaultLocationType: 'remote',
	fields: {
		location: {
			mode: 'conditional' // Required when onsite/hybrid selected
		},
		hiringLocation: {
			mode: 'optional'
		},
		workingPermits: {
			mode: 'optional'
		},
		salary: {
			mode: 'optional'
		}
	}
};

/**
 * Local-Only: Restaurant, retail, healthcare jobs
 * - Only onsite jobs allowed
 * - Location always required
 * - No remote-specific fields
 */
export const LOCAL_ONLY_PRESET: JobBoardConfig = {
	preset: 'local-only',
	allowedLocationTypes: ['onsite'],
	defaultLocationType: 'onsite',
	fields: {
		location: {
			mode: 'required' // Always required
		},
		hiringLocation: {
			mode: 'hidden' // Not relevant for local-only
		},
		workingPermits: {
			mode: 'hidden' // Usually not relevant
		},
		salary: {
			mode: 'optional'
		}
	}
};

/**
 * Hybrid-First: Post-COVID job boards
 * - All location types
 * - Hybrid is default
 * - Location required for onsite/hybrid
 */
export const HYBRID_FIRST_PRESET: JobBoardConfig = {
	preset: 'hybrid-first',
	allowedLocationTypes: ['remote', 'hybrid', 'onsite'],
	defaultLocationType: 'hybrid',
	fields: {
		location: {
			mode: 'conditional'
		},
		hiringLocation: {
			mode: 'optional'
		},
		workingPermits: {
			mode: 'optional'
		},
		salary: {
			mode: 'optional'
		}
	}
};

/**
 * Flexible: General purpose
 * - All location types
 * - No defaults
 * - Location conditional
 */
export const FLEXIBLE_PRESET: JobBoardConfig = {
	preset: 'flexible',
	allowedLocationTypes: ['remote', 'hybrid', 'onsite'],
	fields: {
		location: {
			mode: 'conditional'
		},
		hiringLocation: {
			mode: 'optional'
		},
		workingPermits: {
			mode: 'optional'
		},
		salary: {
			mode: 'optional'
		}
	}
};

const PRESETS_MAP = {
	'remote-first': REMOTE_FIRST_PRESET,
	'local-only': LOCAL_ONLY_PRESET,
	'hybrid-first': HYBRID_FIRST_PRESET,
	flexible: FLEXIBLE_PRESET
} as const;

/**
 * Get a preset by name
 * Returns null for 'custom' preset (requires explicit config)
 */
export function getPreset(name: PresetType): JobBoardConfig | null {
	if (name === 'custom') {
		return null;
	}
	return PRESETS_MAP[name];
}

/**
 * Validate config for logical consistency
 * Throws if config has invalid combinations
 */
function validateConfigLogic(config: JobBoardConfig): void {
	// Validate defaultLocationType is in allowedLocationTypes
	if (
		config.defaultLocationType &&
		!config.allowedLocationTypes.includes(config.defaultLocationType)
	) {
		throw new Error(
			`defaultLocationType "${config.defaultLocationType}" must be in allowedLocationTypes: ${config.allowedLocationTypes.join(', ')}`
		);
	}

	// For local-only boards, location should not be hidden
	if (config.allowedLocationTypes.length === 1 && config.allowedLocationTypes[0] === 'onsite') {
		if (config.fields.location.mode === 'hidden') {
			throw new Error('location field cannot be hidden for local-only job boards');
		}
	}

	// If only remote is allowed, location should probably be hidden or optional
	if (config.allowedLocationTypes.length === 1 && config.allowedLocationTypes[0] === 'remote') {
		if (
			config.fields.location.mode === 'required' ||
			config.fields.location.mode === 'conditional'
		) {
			throw new Error('location field should not be required for remote-only job boards');
		}
	}
}

/**
 * Merge user config with preset and validate
 */
export function resolveConfig(userConfig: Partial<JobBoardConfig>): JobBoardConfig {
	const preset = userConfig.preset || 'remote-first';

	if (preset === 'custom') {
		// Custom preset requires explicit configuration
		if (!userConfig.allowedLocationTypes || !userConfig.fields) {
			throw new Error(
				'Custom preset requires explicit configuration. Please specify allowedLocationTypes and fields.'
			);
		}

		// Validate and return
		const config = jobBoardConfigSchema.parse(userConfig);
		validateConfigLogic(config);
		return config;
	}

	const basePreset = getPreset(preset);
	if (!basePreset) {
		throw new Error(`Unknown preset: ${preset}`);
	}

	// Deep merge user overrides with preset
	const merged: JobBoardConfig = {
		preset: basePreset.preset,
		allowedLocationTypes: userConfig.allowedLocationTypes ?? basePreset.allowedLocationTypes,
		defaultLocationType: userConfig.defaultLocationType ?? basePreset.defaultLocationType,
		fields: {
			location: userConfig.fields?.location ?? basePreset.fields.location,
			hiringLocation: userConfig.fields?.hiringLocation ?? basePreset.fields.hiringLocation,
			workingPermits: userConfig.fields?.workingPermits ?? basePreset.fields.workingPermits,
			salary: userConfig.fields?.salary ?? basePreset.fields.salary
		}
	};

	// Validate merged config
	const validated = jobBoardConfigSchema.parse(merged);
	validateConfigLogic(validated);

	return validated;
}
