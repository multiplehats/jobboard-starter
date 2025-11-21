import { describe, it, expect } from 'vitest';
import { resolveConfig } from '$lib/config/jobs/presets.server.js';

describe('Config Resolution and Validation', () => {
	it('rejects config with invalid defaultLocationType', () => {
		expect(() => {
			resolveConfig({
				preset: 'custom',
				allowedLocationTypes: ['remote'],
				defaultLocationType: 'onsite', // Not in allowedLocationTypes!
				fields: {
					location: { mode: 'hidden' },
					hiringLocation: { mode: 'optional' },
					workingPermits: { mode: 'hidden' },
					salary: { mode: 'optional' }
				}
			});
		}).toThrow();
	});

	it('rejects local-only config with hidden location', () => {
		expect(() => {
			resolveConfig({
				preset: 'custom',
				allowedLocationTypes: ['onsite'],
				fields: {
					location: { mode: 'hidden' }, // Invalid for local-only!
					hiringLocation: { mode: 'hidden' },
					workingPermits: { mode: 'hidden' },
					salary: { mode: 'optional' }
				}
			});
		}).toThrow(/cannot be hidden for local-only/);
	});

	it('rejects remote-only config with required location', () => {
		expect(() => {
			resolveConfig({
				preset: 'custom',
				allowedLocationTypes: ['remote'],
				fields: {
					location: { mode: 'required' }, // Invalid for remote-only!
					hiringLocation: { mode: 'optional' },
					workingPermits: { mode: 'hidden' },
					salary: { mode: 'optional' }
				}
			});
		}).toThrow(/should not be required for remote-only/);
	});

	it('accepts valid custom config', () => {
		const config = resolveConfig({
			preset: 'custom',
			allowedLocationTypes: ['remote', 'onsite'],
			defaultLocationType: 'remote',
			fields: {
				location: { mode: 'conditional' },
				hiringLocation: { mode: 'optional' },
				workingPermits: { mode: 'hidden' },
				salary: { mode: 'required' }
			}
		});

		expect(config.preset).toBe('custom');
		expect(config.fields.salary.mode).toBe('required');
	});

	it('custom preset requires explicit config', () => {
		expect(() => {
			resolveConfig({ preset: 'custom' });
		}).toThrow(/requires explicit configuration/);
	});

	it('merges user overrides with preset', () => {
		const config = resolveConfig({
			preset: 'remote-first',
			fields: {
				salary: { mode: 'required' }
			}
		});

		expect(config.preset).toBe('remote-first');
		expect(config.fields.salary.mode).toBe('required');
		expect(config.fields.location.mode).toBe('conditional'); // From preset
	});
});
